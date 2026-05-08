const OCM_API_URL = 'https://api.openchargemap.io/v3/poi';

/**
 * Fetch stations from Open Charge Map
 * @param {Object} params - Query parameters (lat, lng, distance, maxResults)
 * @returns {Promise<Array>} - Mapped stations
 */
exports.fetchExternalStations = async (params = {}) => {
  const { lat, lng, distance = 50, maxResults = 100 } = params;
  
  const apiKey = process.env.OCM_API_KEY || '1752b7316-89ed-4009-831c-f5a10476fb73'; // Default to a temp key or empty
  
  let url = `${OCM_API_URL}/?output=json&key=${apiKey}&maxresults=${maxResults}&compact=true&verbose=false`;
  
  if (lat && lng) {
    url += `&latitude=${lat}&longitude=${lng}&distance=${distance}&distanceunit=KM`;
  } else {
    url += `&countrycode=IN`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OCM API responded with status: ${response.status}`);
    const data = await response.json();
    
    return data.map(station => mapOCMToEVSync(station));
  } catch (error) {
    console.error('Error fetching from OCM:', error);
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
