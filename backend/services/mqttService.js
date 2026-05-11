const mqtt = require('mqtt');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});



function deriveChargerSpecs(type, powerKw) {
  
  const typeUpper = (type || '').toUpperCase();

  let voltage;
  if (typeUpper.includes('CCS') || typeUpper.includes('CHADEMO') || typeUpper.includes('DC') || typeUpper.includes('GB/T')) {
    // DC chargers: voltage depends on power level
    if      (powerKw <= 50)  voltage = 400;
    else if (powerKw <= 150) voltage = 500;
    else                     voltage = 800;
  } else {
    // AC chargers (Type2, AC, etc)
    voltage = powerKw > 7.4 ? 400 : 230;  // 3-phase above 7.4kW
  }

  const current = Math.round((powerKw * 1000) / voltage);
  const label   = `${type} (${powerKw}kW)`;

  return { voltage, current, label };
}

class MQTTService {
    constructor() {
        this.client = null;
        this.io = null;
        this.ocppLog = [];
        this.esp32Online = false;
        this.lastHeartbeat = null;
        this.activeSessions = new Map(); // transactionId -> bookingId
    }

    init(io) {
        this.io = io;
        this.client = mqtt.connect('mqtt://broker.hivemq.com');

        this.client.on('connect', () => {
            console.log('Connected to broker.hivemq.com');
            this.client.subscribe(['ev/ocpp/#', 'ev/charger/#'], (err) => {
                if (err) console.error('MQTT Subscription Error:', err);
            });
        });

        this.client.on('error', (err) => {
            console.error('MQTT Connection Error:', err);
        });

        this.client.on('message', (topic, message) => {
            console.log(`MQTT Message [${topic}]:`, message.toString());
            this.handleMessage(topic, message.toString());
        });

        // FIX 3: Removed the 2-second polling interval that flooded sockets.
        // The frontend now relies on real charging_update events from meter values (every 10s).
        // Uncomment below if you need a liveness indicator, but keep it at 15s minimum:
        //
        // setInterval(async () => { ... }, 15000);

        // Online status check every 30s
        setInterval(() => {
            if (this.lastHeartbeat && (Date.now() - this.lastHeartbeat > 60000)) {
                this.esp32Online = false;
                this.io.emit('esp32Status', { online: false });
            }
        }, 30000);
    }

    handleMessage(topic, payload) {
        console.log('===============================');
        console.log('Topic:', topic);
        console.log('Payload:', payload);
        console.log('===============================');

        try {
            const data = JSON.parse(payload);

            if (topic.startsWith('ev/ocpp/')) {
                this.addToLog(topic, data);
            }

            switch (topic) {
                case 'ev/charger/heartbeat':
                    console.log('Heartbeat received');
                    this.esp32Online = true;
                    this.lastHeartbeat = Date.now();
                    this.io.emit('esp32Status', { online: true });
                    break;

                case 'ev/ocpp/boot':
                    console.log('BootNotification received:', data);
                    break;

                case 'ev/ocpp/status':
                    console.log('StatusNotification received:', data.status);
                    this.handleStatusNotification(data);
                    break;

                case 'ev/ocpp/meter':
                    console.log('METER VALUES RECEIVED');
                    console.log('  transactionId:', data.transactionId);
                    console.log('  energyKwh:',     data.energyKwh);
                    console.log('  batteryPercent:', data.batteryPercent);
                    console.log('  elapsedTime:',   data.elapsedTime);
                    console.log('  minsRemaining:',  data.minsRemaining);
                    this.handleMeterValues(data);
                    break;

                case 'ev/ocpp/transaction':
                    console.log('Transaction received:', data.ocppAction, '| transactionId:', data.transactionId);
                    if (data.ocppAction === 'StartTransaction') {
                        console.log('StartTransaction - charging begins');
                    } else if (data.ocppAction === 'StopTransaction') {
                        console.log('StopTransaction | meterStop:', data.meterStop, '| costINR:', data.costINR, '| reason:', data.reason);
                        this.handleStopTransaction(data);
                    }
                    break;

                case 'ev/charger/status':
                    console.log('Charger status:', payload);
                    break;

                case 'ev/charger/battery':
                    console.log('Battery event:', data);
                    this.io.emit('batteryFull', data);
                    break;

                default:
                    console.log('Unknown topic:', topic);
            }

        } catch (e) {
            // Non-JSON payload (e.g. plain "ONLINE" heartbeat)
            console.log('Non-JSON payload:', payload);
            if (topic === 'ev/charger/heartbeat' && payload === 'ONLINE') {
                console.log('Heartbeat (plain text) received');
                this.esp32Online = true;
                this.lastHeartbeat = Date.now();
                this.io.emit('esp32Status', { online: true });
            }
        }
    }

    addToLog(topic, data) {
        const entry = {
            timestamp: new Date(),
            action: data.ocppAction || topic.split('/').pop(),
            data: data
        };
        this.ocppLog.unshift(entry);
        if (this.ocppLog.length > 50) this.ocppLog.pop();
        this.io.emit('ocppMessage', entry);
    }

    async handleStatusNotification(data) {
        // FIX 2: Only update DB for statuses that correspond to an active charging booking.
        // "Preparing" arrives before booking is charging, "Available" after it's done —
        // neither has a booking to update. Only "Charging" and "Finishing" are relevant.
        const statusesToUpdate = ['Charging', 'Finishing'];
        if (!statusesToUpdate.includes(data.status)) {
            console.log(`Status "${data.status}" — no DB update needed`);
            return;
        }

        const booking = await Booking.findOne({ bookingStatus: 'charging' }).populate('stationId');
        if (booking) {
            booking.statusMessage = `Charger status: ${data.status}`;
            await booking.save();

            this.io.emit('charging_update', {
                bookingId:     booking._id,
                status:        'charging',
                statusMessage: booking.statusMessage,
                powerKw:       data.powerKw
            });
        }
    }

    async handleMeterValues(data) {
        console.log('handleMeterValues called, transactionId:', data.transactionId);

        let booking = await Booking.findOne({
            transactionId: data.transactionId,
            bookingStatus: 'charging'
        });

        console.log('Booking by transactionId:', booking ? `Found: ${booking._id}` : 'NOT FOUND');

        if (!booking) {
            console.warn('Trying fallback — any charging booking...');
            booking = await Booking.findOne({ bookingStatus: 'charging' });
            console.log('Fallback result:', booking ? `Found: ${booking._id}` : 'NOTHING FOUND');

            if (booking) {
                booking.transactionId = data.transactionId;
                await booking.save();
                console.log('TransactionId fixed and saved:', data.transactionId);
            }
        }

        if (booking) {
            // FIX 1: Use ?? (nullish coalescing) instead of || so that 0 is a valid value.
            // With ||, energyKwh=0.0 at session start would fall through to booking.currentKwh,
            // causing a stale value on the first meter update.
            const newBattery = data.batteryPercent ?? booking.percentage;
            const newKwh     = data.energyKwh     ?? booking.currentKwh;

            booking.percentage = newBattery;
            booking.currentKwh = newKwh;
            await booking.save();
            console.log('DB updated successfully');

            this.io.emit('charging_update', {
                bookingId:      booking._id,
                percentage:     newBattery,
                currentKwh:     newKwh,
                minsRemaining:  data.minsRemaining,
                powerKw:        data.powerKw,
                elapsedTime:    data.elapsedTime,
                currentCostINR: data.currentCostINR ?? 0,
                status:         'charging'
            });

            // Also emit statusUpdate for dashboard listeners
            this.io.emit('statusUpdate', {
                bookingId:  booking._id,
                charging:   true,
                percentage: newBattery,
                currentKwh: newKwh,
                status:     'charging'
            });

            console.log(`MeterValues: ${newKwh} kWh | Battery: ${newBattery}% | ETA: ${data.minsRemaining} mins | emit done`);

        } else {
            console.error('NO BOOKING FOUND — MeterValues dropped!');
            const all = await Booking.find({}, 'bookingStatus transactionId _id');
            console.table(all.map(b => ({
                id:            b._id.toString(),
                status:        b.bookingStatus,
                transactionId: b.transactionId
            })));
        }
    }

    async handleStopTransaction(data) {
        let booking = await Booking.findOne({
            transactionId: data.transactionId
        }).populate('stationId');

        if (!booking) {
            console.warn('StopTransaction: transactionId not found, using fallback...');
            booking = await Booking.findOne({
                bookingStatus: { $in: ['charging', 'billing_pending'] }
            }).populate('stationId');
        }

        if (booking) {
            const totalKwh  = parseFloat(data.meterStop) || 0;
            const totalBill = parseFloat(data.costINR) || (totalKwh * (booking.ratePerKwh || 8.0));
            const duration  = data.elapsedTime || "00:00:00";

            booking.bookingStatus = 'billing_pending';
            booking.unitsConsumed = totalKwh;
            booking.totalBill     = totalBill;
            booking.statusMessage = `Session stopped: ${data.reason}`;
            booking.transactionId = data.transactionId;
            booking.elapsedTime   = duration; // Ensure we save this if model supports it


            // FIX 4: Guard against Razorpay rejecting a zero or sub-minimum order.
            // Razorpay requires a minimum of Rs.1 (100 paise).
            // This fires if a session is stopped immediately before meaningful energy is delivered.
            const amountPaise = Math.round(totalBill * 100);
            if (amountPaise >= 100) {
                try {
                    const order = await razorpay.orders.create({
                        amount:   amountPaise,
                        currency: "INR",
                        receipt:  `bill_${booking._id}`
                    });
                    booking.billOrderId = order.id;
                } catch (err) {
                    console.error("Razorpay Order Error:", err);
                }
            } else {
                console.warn(`Bill is Rs.${totalBill.toFixed(2)} — below Razorpay minimum, skipping order creation`);
            }

            await booking.save();

            this.io.emit('charging_update', {
                bookingId:     booking._id,
                status:        'billing_pending',
                unitsConsumed: booking.unitsConsumed,
                totalBill:     booking.totalBill
            });

            this.io.emit('bill_generated', {
                bookingId:     booking._id,
                unitsConsumed: booking.unitsConsumed,
                totalBill:     booking.totalBill,
                order: booking.billOrderId ? {
                    id:       booking.billOrderId,
                    amount:   amountPaise,
                    currency: "INR",
                    key:      process.env.RAZORPAY_KEY_ID
                } : null,
                paymentStatus: 'unpaid'
            });

            console.log(`Session complete: ${data.reason} | kWh: ${totalKwh} | Rs.${totalBill.toFixed(2)}`);
        }
    }

   async startCharging(bookingId, config) {
  if (!this.client) return;

  const booking = await Booking.findById(bookingId).populate('stationId');
  if (!booking || !booking.stationId) {
    console.error('Booking or Station not found for MQTT start:', bookingId);
    return;
  }

  const charger = booking.stationId.chargers.find(c => c.chargerId === booking.chargerId);
  if (!charger) {
    console.error('Charger not found in station:', booking.chargerId);
    return;
  }

  // Derive what ESP32 needs from existing schema fields
  const { voltage, current, label } = deriveChargerSpecs(charger.type, charger.power);

  const transactionId = `TXN_${bookingId.toString().slice(-6)}`;

  const command = {
    action:          "START",
    transactionId:   transactionId,

    // All derived — no schema change needed
    chargerType:     charger.type,       
    chargerLabel:    label,              
    powerKw:         charger.power,      
    voltage:         voltage,            
    current:         current,            

    // Pricing — your existing fields
    ratePerKwh:      charger.pricePerUnit,
    ratePerMinute:   charger.pricePerMinute,

    // Session — from booking
    batteryCapacity: config.batteryCapacity || 40,
    currentPercent:  config.currentPercent || 20,
    targetPercent:   config.targetPercent || 80,
  };

  this.client.publish('ev/charger/control', JSON.stringify(command));

  await Booking.findByIdAndUpdate(bookingId, {
    transactionId,
    bookingStatus: 'charging',
    percentage:    config.currentPercent,
    currentKwh:    0,
    ratePerKwh:    charger.pricePerUnit,  // snapshot at session start
  });

  this.activeSessions.set(transactionId, bookingId.toString());
  console.log(`Started: ${charger.chargerId} | ${label} | ${charger.power}kW | Rs.${charger.pricePerUnit}/kWh | TXN: ${transactionId}`);
}


    stopCharging(bookingId) {
        if (!this.client) return;
        this.client.publish('ev/charger/control', JSON.stringify({ action: "STOP" }));
    }
}

module.exports = new MQTTService();