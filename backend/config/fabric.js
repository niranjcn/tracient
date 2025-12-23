/**
 * Hyperledger Fabric Gateway Configuration
 * This module provides connection to the Fabric network
 * Falls back to mock implementation if Fabric packages not installed
 */
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.util.js';

// Try to import Fabric packages
let Gateway, Wallets, grpc;
let fabricAvailable = false;

try {
  const fabricGateway = await import('@hyperledger/fabric-gateway');
  Gateway = fabricGateway.Gateway;
  Wallets = fabricGateway.Wallets;
  grpc = await import('@grpc/grpc-js');
  fabricAvailable = true;
  logger.info('Hyperledger Fabric packages loaded successfully');
} catch (err) {
  logger.warn('Hyperledger Fabric packages not installed - using mock implementation');
  fabricAvailable = false;
}

// Fabric configuration from environment
const FABRIC_CONFIG = {
  channelName: process.env.FABRIC_CHANNEL || 'tracientchannel',
  chaincodeName: process.env.FABRIC_CHAINCODE || 'tracient',
  mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
  cryptoPath: process.env.FABRIC_CRYPTO_PATH || path.resolve('..', 'blockchain', 'network', 'organizations'),
  peerEndpoint: process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051',
  peerHostAlias: process.env.FABRIC_PEER_HOST_ALIAS || 'peer0.org1.example.com'
};

let client = null;
let gateway = null;
let contract = null;

/**
 * Initialize Fabric Gateway connection
 */
export const initFabricGateway = async () => {
  if (!fabricAvailable) {
    logger.info('Fabric not available - using mock mode');
    return false;
  }
  
  try {
    logger.info('Initializing Fabric Gateway connection...');

    // Check if Fabric is enabled
    if (process.env.FABRIC_ENABLED !== 'true') {
      logger.warn('Fabric integration is disabled. Set FABRIC_ENABLED=true to enable.');
      return null;
    }

    // Load credentials
    const credentials = await loadCredentials();
    if (!credentials) {
      logger.warn('Fabric credentials not found. Running in mock mode.');
      return null;
    }

    // Create gRPC client
    client = await createGrpcClient(credentials.tlsCertificate);

    // Create gateway
    gateway = new Gateway();
    
    const identity = {
      mspId: FABRIC_CONFIG.mspId,
      credentials: credentials.certificate
    };

    const signer = crypto.createPrivateKey(credentials.privateKey);

    await gateway.connect({
      client,
      identity,
      signer,
      evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
      endorseOptions: () => ({ deadline: Date.now() + 15000 }),
      submitOptions: () => ({ deadline: Date.now() + 5000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 })
    });

    // Get network and contract
    const network = gateway.getNetwork(FABRIC_CONFIG.channelName);
    contract = network.getContract(FABRIC_CONFIG.chaincodeName);

    logger.info('Fabric Gateway connected successfully');
    return contract;
  } catch (error) {
    logger.error('Failed to initialize Fabric Gateway:', error.message);
    return null;
  }
};

/**
 * Load TLS and identity credentials
 */
const loadCredentials = async () => {
  try {
    const cryptoPath = FABRIC_CONFIG.cryptoPath;
    const orgPath = path.join(cryptoPath, 'peerOrganizations', 'org1.example.com');

    // TLS certificate
    const tlsCertPath = path.join(orgPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
    const tlsCertificate = await fs.readFile(tlsCertPath);

    // User certificate
    const certPath = path.join(orgPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem');
    const certificate = await fs.readFile(certPath);

    // Private key
    const keyDirPath = path.join(orgPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
    const keyFiles = await fs.readdir(keyDirPath);
    const keyPath = path.join(keyDirPath, keyFiles[0]);
    const privateKey = await fs.readFile(keyPath);

    return { tlsCertificate, certificate, privateKey };
  } catch (error) {
    logger.warn('Could not load Fabric credentials:', error.message);
    return null;
  }
};

/**
 * Create gRPC client connection
 */
const createGrpcClient = async (tlsCertificate) => {
  const tlsCredentials = grpc.credentials.createSsl(tlsCertificate);
  return new grpc.Client(
    FABRIC_CONFIG.peerEndpoint,
    tlsCredentials,
    { 'grpc.ssl_target_name_override': FABRIC_CONFIG.peerHostAlias }
  );
};

/**
 * Get the Fabric contract instance
 */
export const getContract = () => {
  return contract;
};

/**
 * Submit a transaction to the blockchain
 */
export const submitTransaction = async (functionName, ...args) => {
  try {
    if (!contract) {
      logger.warn('Fabric contract not initialized. Using mock response.');
      return mockTransaction(functionName, args);
    }

    const result = await contract.submitTransaction(functionName, ...args);
    return JSON.parse(result.toString());
  } catch (error) {
    logger.error(`Transaction ${functionName} failed:`, error.message);
    throw error;
  }
};

/**
 * Evaluate a query on the blockchain
 */
export const evaluateTransaction = async (functionName, ...args) => {
  try {
    if (!contract) {
      logger.warn('Fabric contract not initialized. Using mock response.');
      return mockTransaction(functionName, args);
    }

    const result = await contract.evaluateTransaction(functionName, ...args);
    return JSON.parse(result.toString());
  } catch (error) {
    logger.error(`Query ${functionName} failed:`, error.message);
    throw error;
  }
};

/**
 * Mock transaction for when Fabric is not connected
 */
const mockTransaction = (functionName, args) => {
  logger.info(`Mock transaction: ${functionName}(${args.join(', ')})`);
  return {
    success: true,
    mock: true,
    functionName,
    args,
    timestamp: new Date().toISOString(),
    txId: `mock-${Date.now()}`
  };
};

/**
 * Close Fabric Gateway connection
 */
export const closeFabricGateway = async () => {
  try {
    if (gateway) {
      gateway.close();
      logger.info('Fabric Gateway connection closed');
    }
    if (client) {
      client.close();
      logger.info('gRPC client connection closed');
    }
  } catch (error) {
    logger.error('Error closing Fabric Gateway:', error.message);
  }
};

export default {
  initFabricGateway,
  getContract,
  submitTransaction,
  evaluateTransaction,
  closeFabricGateway
};
