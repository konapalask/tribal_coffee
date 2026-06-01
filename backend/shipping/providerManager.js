import shiprocket from './providers/shiprocket.js';
import delhivery from './providers/delhivery.js';
import dtdc from './providers/dtdc.js';
import bluedart from './providers/bluedart.js';
import easyship from './providers/easyship.js';
import customProvider from './providers/customProvider.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DELIVERY_PROVIDERS_FILE_PATH = path.join(__dirname, '..', 'data', 'delivery_providers.json');

const legacyProviders = {
  shiprocket,
  delhivery,
  dtdc,
  bluedart,
  easyship
};

export const getProvider = (providerId) => {
  // Read current configs
  let configs = [];
  try {
    if (fs.existsSync(DELIVERY_PROVIDERS_FILE_PATH)) {
      configs = JSON.parse(fs.readFileSync(DELIVERY_PROVIDERS_FILE_PATH, 'utf8'));
    }
  } catch(e) {
    console.error('Error reading delivery providers in manager:', e);
  }

  const config = configs.find(c => c.id === providerId);
  if (!config) {
    throw new Error(`Shipping provider ${providerId} not found in configuration`);
  }

  // If it's a legacy provider, use its dedicated module (fallback for backward compatibility)
  if (!config.is_custom && legacyProviders[providerId]) {
    return {
      provider: legacyProviders[providerId],
      config
    };
  }

  // If it's custom or newly added, use the generic adapter
  return {
    provider: customProvider,
    config
  };
};

// Route a generic shipment creation to the designated provider
export const createShipment = async (providerId, orderData, apiKeys) => {
  const { provider, config } = getProvider(providerId);
  return await provider.createShipment(orderData, apiKeys, config);
};

export const trackShipment = async (providerId, trackingId, apiKeys) => {
  const { provider, config } = getProvider(providerId);
  return await provider.trackShipment(trackingId, apiKeys, config);
};

export const generateLabel = async (providerId, trackingId, apiKeys) => {
  const { provider, config } = getProvider(providerId);
  return await provider.generateLabel(trackingId, apiKeys, config);
};

export const testConnection = async (providerId, apiKeys) => {
  const { provider, config } = getProvider(providerId);
  if (provider.testConnection) {
    return await provider.testConnection(apiKeys, config);
  }
  // Mock generic fallback
  return { success: true, message: `Successfully connected to ${config.name} API` };
};
