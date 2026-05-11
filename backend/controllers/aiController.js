const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// Note: If using Node 18+, global fetch is available. If not, we might need node-fetch.
// However, I will check if I should just use axios since it's more common.
// Let's use axios for better error handling.

const axios = require('axios');

const getRecommendation = async (req, res) => {
  try {
    const { userLocation, vehicleInfo, stations, destination } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // If no API key, return a mock recommendation to not break the UI
      return res.status(200).json({
        success: true,
        isMock: true,
        recommendations: [{
          stationId: stations[0]?._id,
          name: stations[0]?.name || "New Market EcoCharge",
          reason: "Highest rated station on your current route with high availability.",
          waitTime: "Lower wait time",
          badges: ["On your route", "Lower wait time"],
        }]
      });
    }

    const prompt = `
      You are an expert EV charging assistant for the EVSync platform. 
      Recommend 2-3 best charging stations from the provided list based on:
      1. CRITICAL: Only recommend stations with at least one 'available' charger.
      2. PROXIMITY (Highest Priority): Prefer stations closest to the user. A station within 2-5km is MUCH better than one 10km+ away, even if the further one has a slightly higher rating.
      3. QUALITY: Among nearby stations, prioritize those with higher ratings (4.5+) and faster charging power (100kW+).

      User Info:
      - Location: ${JSON.stringify(userLocation)}
      - Vehicle: ${JSON.stringify(vehicleInfo)}
      - Destination: ${destination || "Not specified"}

      Nearby Available Stations:
      ${JSON.stringify(stations.map(s => {
        const availableSlots = s.chargers?.filter(c => c.status === "available").length || 0;
        const totalSlots = s.chargers?.length || 0;
        return {
          id: s._id,
          name: s.name,
          slots: `${availableSlots}/${totalSlots} available`,
          maxPower: Math.max(...(s.chargers?.map(c => c.power) || [0])) + "kW",
          rating: s.rating,
          distance: s.distance?.toFixed(2) + "km"
        };
      }))}

      Rules:
      1. Provide a short, persuasive reason for each (max 12 words).
      2. Identify 2-3 specific badges (e.g., "Top Rated", "Ultra Fast", "Most Reliable").
      3. Return ONLY a JSON object. Do not include any conversation, markdown backticks, or text before/after the JSON.
      
      Format:
      {
        "recommendations": [
          {
            "stationId": "...",
            "reason": "...",
            "waitTime": "...",
            "badges": ["...", "..."]
          },
          ...
        ]
      }
    `;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "openai/gpt-oss-120b:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://evsync.com',
        'X-Title': 'EVSync AI Assistant',
        'Content-Type': 'application/json'
      }
    });

    let content = response.data?.choices?.[0]?.message?.content;
    console.log("AI Raw Response:", content);

    if (!content) {
      throw new Error("Empty AI response received");
    }

    let data;
    if (typeof content === 'string') {
      // Remove markdown blocks, leading/trailing non-JSON characters
      const cleaned = content.replace(/```(?:json)?|```/g, '').trim();
      try {
        data = JSON.parse(cleaned);
      } catch (e) {
        // If it still fails, try to find the first '{' and last '}'
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          data = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } else {
          throw e;
        }
      }
    } else {
      data = content;
    }

    res.status(200).json({ success: true, recommendations: data.recommendations || [] });

  } catch (error) {
    console.error("AI Recommendation Error:", error.response?.data || error.message);
    
    // Fallback recommendations
    const fallbackRecommendations = [
      {
        stationId: req.body.stations?.[0]?._id || "fallback-1",
        reason: "Highest rated fast charger near your current location.",
        waitTime: "No wait",
        badges: ["Best Match", "Fast Charge"]
      }
    ];

    res.status(200).json({ 
      success: true, 
      recommendations: fallbackRecommendations,
      isFallback: true 
    });
  }
};

module.exports = { getRecommendation };
