// Mock Shiprocket Provider
export default {
  createShipment: async (orderData, apiKeys) => {
    // In a real scenario, make axios/fetch call to Shiprocket API
    console.log(`[Shiprocket] Creating shipment for order`, orderData);
    return { success: true, trackingId: `SR-${Date.now()}`, provider: 'shiprocket' };
  },
  trackShipment: async (trackingId, apiKeys) => {
    return { status: 'In Transit', location: 'Hub', provider: 'shiprocket' };
  },
  generateLabel: async (trackingId, apiKeys) => {
    return { url: 'https://shiprocket.in/labels/mock.pdf' };
  }
};
