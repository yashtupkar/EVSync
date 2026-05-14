const OCM_API_URL = 'https://api.openchargemap.io/v3/poi';

/**
 * Fetch stations from Open Charge Map
 * @param {Object} params - Query parameters (lat, lng, distance, maxResults)
 * @returns {Promise<Array>} - Mapped stations
 */
exports.fetchExternalStations = async (params = {}) => {
  const { lat, lng, distance = 100, maxResults = 50 } = params;
  
  const apiKey = process.env.OCM_API_KEY || '1752b7316-89ed-4009-831c-f5a10476fb73'; // Default to a temp key or empty
  
  let url = `${OCM_API_URL}/?output=json&key=${apiKey}&maxresults=${maxResults}&compact=true&verbose=false`;
  
  if (lat && lng) {
    url += `&latitude=${lat}&longitude=${lng}&distance=${distance}&distanceunit=KM`;
  } else {
    url += `&countrycode=IN`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[OCM] API responded with status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.map(station => mapOCMToEVSync(station));
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('[OCM] Fetch timed out after 5s. Skipping external stations.');
    } else if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.warn('[OCM] Connection timeout. External network unreachable.');
    } else {
      console.error('[OCM] Error fetching external stations:', error.message);
    }
    return [];
  }
};

/**
 * Maps OCM station data to EVSync Station schema
 */
function mapOCMToEVSync(ocmStation) {
  const { AddressInfo, Connections, ID, MediaItems } = ocmStation;
  
  // Map chargers
  const chargers = (Connections || []).map((conn, index) => ({
    chargerId: `ocm-${ID}-${index}`,
    type: mapConnectionType(conn.ConnectionTypeID),
    power: conn.PowerKW || 22,
    status: mapStatus(conn.StatusTypeID),
    pricePerUnit: 15, // Default price
    totalSlots: 1
  }));

  // Map images
  const images = (MediaItems || []).map(item => item.ItemThumbnailURL || item.ItemURL)
    .filter(url => url);
  
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1593941707882-a5bba14938c7'); // Placeholder
  }

  return {
    _id: `ocm_${ID}`,
    name: AddressInfo.Title || 'Unknown Station',
    address: `${AddressInfo.AddressLine1 || ''}, ${AddressInfo.Town || ''}, ${AddressInfo.StateOrProvince || ''}`.trim().replace(/^,|,$/g, ''),
    location: {
      type: 'Point',
      coordinates: [AddressInfo.Longitude, AddressInfo.Latitude]
    },
    images,
    chargers,
    rating: ocmStation.UserComments?.[0]?.Rating || 4.0,
    reviewsCount: ocmStation.UserComments?.length || 0,
    external: true, // Mark as external
    operatorName: AddressInfo.AccessComments || 'Public Network',
    stationType: 'unmanned',
    amenities: ['Parking']
  };
}

function mapConnectionType(id) {
  const types = {
    1: 'Type 2',
    25: 'CCS2',
    2: 'CHAdeMO',
    33: 'CCS2',
    3: 'Type 1',
    30: 'Tesla',
    1036: 'Type 2'
  };
  return types[id] || 'Type 2';
}

function mapStatus(id) {
  const statuses = {
    50: 'available',
    75: 'in_use',
    100: 'maintenance',
    0: 'available'
  };
  return statuses[id] || 'available';
}
