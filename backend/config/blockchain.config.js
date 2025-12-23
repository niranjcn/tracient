/**
 * Blockchain Integration Configuration
 * 
 * This file controls whether blockchain (Hyperledger Fabric) integration is active.
 * Set enabled to false to run in database-only mode.
 * When ready to integrate blockchain, set enabled to true.
 */

export const blockchainConfig = {
  // Master toggle for blockchain integration
  enabled: process.env.BLOCKCHAIN_ENABLED === 'true' || false,
  
  // Use mock responses when blockchain is disabled
  mockMode: true,
  
  // Fabric network configuration (used when enabled = true)
  fabricNetworkPath: process.env.FABRIC_NETWORK_PATH || '../blockchain/network/test-network',
  channelName: process.env.FABRIC_CHANNEL_NAME || 'mychannel',
  chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'tracient',
  mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
  walletPath: process.env.FABRIC_WALLET_PATH || './fabric-wallet',
  userId: process.env.FABRIC_USER_ID || 'appUser',
  
  // Logging
  logBlockchainSkips: true, // Log when blockchain calls are skipped
};

/**
 * Helper function to check if blockchain is enabled
 */
export const isBlockchainEnabled = () => blockchainConfig.enabled;

/**
 * Helper function to log blockchain skip messages
 */
export const logBlockchainSkip = (operation, logger) => {
  if (blockchainConfig.logBlockchainSkips && logger) {
    logger.info(`Blockchain disabled - skipping: ${operation}`);
  }
};

export default blockchainConfig;
