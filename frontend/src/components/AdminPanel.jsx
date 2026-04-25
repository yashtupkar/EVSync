import React, { useState, useEffect } from 'react';
import { getAllStations, createStation, getAllUsers } from '../api/stationApi';
import { Plus, Users, MapPin, Zap, X } from 'lucide-react';

const AdminPanel = () => {
    const [stations, setStations] = useState([]);
    const [users, setUsers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStation, setNewStation] = useState({
        name: '',
        address: '',
        longitude: '',
        latitude: '',
        chargerType: 'CCS2',
        power: 50,
        price: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stRes, usRes] = await Promise.all([getAllStations(), getAllUsers()]);
            setStations(stRes.data);
            setUsers(usRes.data);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    const handleAddStation = async (e) => {
        e.preventDefault();
        try {
            const stationData = {
                name: newStation.name,
                address: newStation.address,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(newStation.longitude), parseFloat(newStation.latitude)]
                },
                chargers: [{
                    type: newStation.chargerType,
                    power: parseInt(newStation.power),
                    pricePerHour: parseFloat(newStation.price)
                }]
            };
            await createStation(stationData);
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            alert("Error adding station: " + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAF9] text-gray-900 pt-32 pb-12 px-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                            Admin <span className="text-[#1BAC4B]">Control Center</span>
                        </h1>
                        <p className="text-gray-400 mt-2 font-medium">Manage infrastructure and users across the network.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 bg-[#1BAC4B] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#189a43] hover:scale-105 transition-all shadow-lg shadow-green-100"
                    >
                        <Plus size={20} /> Add Station
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-[#1BAC4B]/10 p-3 rounded-2xl text-[#1BAC4B]"><MapPin size={26} /></div>
                            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider">Total Stations</h3>
                        </div>
                        <span className="text-5xl font-bold text-gray-900 tracking-tighter">{stations.length}</span>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-500"><Users size={26} /></div>
                            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider">Active Users</h3>
                        </div>
                        <span className="text-5xl font-bold text-gray-900 tracking-tighter">{users.length}</span>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-500"><Zap size={26} /></div>
                            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider">Total Chargers</h3>
                        </div>
                        <span className="text-5xl font-bold text-gray-900 tracking-tighter">
                            {stations.reduce((acc, st) => acc + st.chargers.length, 0)}
                        </span>
                    </div>
                </div>

                <section className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Station Inventory</h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Latest Update: Just Now</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                                    <th className="p-6">Station Name</th>
                                    <th className="p-6">Location</th>
                                    <th className="p-6">Chargers</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stations.map(st => (
                                    <tr key={st._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6 font-bold text-gray-900 text-lg">{st.name}</td>
                                        <td className="p-6 text-gray-400 text-sm font-medium">{st.address}</td>
                                        <td className="p-6">
                                            <div className="flex flex-wrap gap-2">
                                                {st.chargers.map((c, i) => (
                                                    <span key={i} className="bg-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-600">
                                                        {c.type} • {c.power}kW
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                                                <span className="text-xs text-green-600 uppercase font-bold tracking-wider">Online</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <button className="text-[#1BAC4B] hover:bg-[#1BAC4B]/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Add Station Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 relative shadow-[0_40px_80px_rgba(0,0,0,0.2)] border border-gray-100 animate-in zoom-in-95 duration-300">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                            <h2 className="text-3xl font-bold mb-8 tracking-tight text-gray-900">Add New <span className="text-[#1BAC4B]">Station</span></h2>
                            <form onSubmit={handleAddStation} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Station Name</label>
                                    <input 
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-medium transition-all"
                                        placeholder="e.g. Green Energy Hub"
                                        value={newStation.name}
                                        onChange={e => setNewStation({...newStation, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Address</label>
                                    <input 
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-medium transition-all"
                                        placeholder="Full address here..."
                                        value={newStation.address}
                                        onChange={e => setNewStation({...newStation, address: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Longitude</label>
                                        <input 
                                            type="number" step="any"
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-medium transition-all"
                                            placeholder="77.4126"
                                            value={newStation.longitude}
                                            onChange={e => setNewStation({...newStation, longitude: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Latitude</label>
                                        <input 
                                            type="number" step="any"
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-medium transition-all"
                                            placeholder="23.2599"
                                            value={newStation.latitude}
                                            onChange={e => setNewStation({...newStation, latitude: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Charger</label>
                                        <select 
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-bold transition-all"
                                            value={newStation.chargerType}
                                            onChange={e => setNewStation({...newStation, chargerType: e.target.value})}
                                        >
                                            <option value="CCS2">CCS2</option>
                                            <option value="Type 2">Type 2</option>
                                            <option value="CHAdeMO">CHAdeMO</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Power (kW)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-medium transition-all"
                                            value={newStation.power}
                                            onChange={e => setNewStation({...newStation, power: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Price/hr</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-[#1BAC4B]/30 focus:bg-white text-gray-800 font-medium transition-all"
                                            value={newStation.price}
                                            onChange={e => setNewStation({...newStation, price: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#1BAC4B] text-white font-bold px-8 py-5 rounded-[2rem] uppercase tracking-[0.2em] mt-4 hover:bg-[#189a43] transition-all shadow-xl shadow-green-100">
                                    Register Station
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
