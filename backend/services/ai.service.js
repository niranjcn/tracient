/**
 * AI Service for Anomaly Detection and BPL Classification
 * Interfaces with Python AI models
 */
import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger.util.js';
import { calculateBPLStatus, calculateIncomeTrend } from '../utils/bpl.util.js';

const AI_MODEL_PATH = process.env.AI_MODEL_PATH || path.resolve('..', 'ai-model');

/**
 * Detect anomalies in transaction data
 */
export const detectAnomaly = async (transactionData) => {
  try {
    // Use rule-based detection as fallback if AI model not available
    const ruleBasedResult = ruleBasedAnomalyDetection(transactionData);
    
    // Try Python AI model
    const aiResult = await runPythonModel('detect_anomaly', transactionData);
    
    if (aiResult.success) {
      return {
        success: true,
        isAnomaly: aiResult.data.is_anomaly || ruleBasedResult.isAnomaly,
        confidence: aiResult.data.confidence || ruleBasedResult.confidence,
        anomalyType: aiResult.data.anomaly_type || ruleBasedResult.type,
        details: {
          aiModel: aiResult.data,
          ruleBased: ruleBasedResult
        }
      };
    }
    
    // Fallback to rule-based only
    return {
      success: true,
      isAnomaly: ruleBasedResult.isAnomaly,
      confidence: ruleBasedResult.confidence,
      anomalyType: ruleBasedResult.type,
      details: { ruleBased: ruleBasedResult },
      note: 'AI model unavailable, using rule-based detection'
    };
  } catch (error) {
    logger.error('Anomaly detection failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Rule-based anomaly detection
 */
const ruleBasedAnomalyDetection = (data) => {
  const { amount, historicalAvg, transactionCount24h, lastTransactionTime } = data;
  
  let isAnomaly = false;
  let confidence = 0;
  let type = null;
  const reasons = [];
  
  // Check for amount spike
  if (historicalAvg && amount > historicalAvg * 3) {
    isAnomaly = true;
    confidence += 40;
    type = 'income_spike';
    reasons.push(`Amount ${amount} is ${(amount / historicalAvg * 100).toFixed(0)}% of average`);
  }
  
  // Check for high frequency
  if (transactionCount24h > 50) {
    isAnomaly = true;
    confidence += 30;
    type = type || 'high_frequency';
    reasons.push(`${transactionCount24h} transactions in 24 hours`);
  }
  
  // Check for duplicate transactions (same amount within 5 minutes)
  if (lastTransactionTime) {
    const timeDiff = Date.now() - new Date(lastTransactionTime).getTime();
    if (timeDiff < 5 * 60 * 1000) {
      confidence += 20;
      type = type || 'duplicate_transaction';
      reasons.push('Transaction within 5 minutes of previous');
    }
  }
  
  // Check for unusual amount
  if (amount > 100000) {
    confidence += 10;
    reasons.push('High value transaction');
  }
  
  return {
    isAnomaly,
    confidence: Math.min(confidence, 100),
    type,
    reasons
  };
};

/**
 * Classify household as BPL/APL
 */
export const classifyBPL = async (wageRecords) => {
  try {
    // Calculate using built-in BPL utility
    const bplResult = calculateBPLStatus(wageRecords);
    const trendResult = calculateIncomeTrend(wageRecords);
    
    // Try Python AI model for enhanced classification
    const aiResult = await runPythonModel('classify_bpl', {
      annualIncome: bplResult.annualIncome,
      monthlyIncome: bplResult.monthlyIncome,
      transactionCount: wageRecords.length,
      trend: trendResult.changePercent
    });
    
    return {
      success: true,
      ...bplResult,
      trend: trendResult,
      aiClassification: aiResult.success ? aiResult.data : null
    };
  } catch (error) {
    logger.error('BPL classification failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Predict future income trends
 */
export const predictIncome = async (workerData, wageRecords) => {
  try {
    const trend = calculateIncomeTrend(wageRecords, 6);
    
    const predictions = {
      nextMonth: null,
      nextQuarter: null,
      confidence: 'low'
    };
    
    if (wageRecords.length >= 3 && trend.trend !== 'insufficient_data') {
      const avgMonthly = wageRecords.reduce((sum, r) => sum + r.amount, 0) / 
                        Math.max(trend.periodData.length, 1);
      
      const growthRate = trend.changePercent / 100;
      
      predictions.nextMonth = Math.round(avgMonthly * (1 + growthRate / 6));
      predictions.nextQuarter = Math.round(avgMonthly * 3 * (1 + growthRate / 2));
      predictions.confidence = wageRecords.length > 6 ? 'high' : 'medium';
    }
    
    return {
      success: true,
      trend,
      predictions
    };
  } catch (error) {
    logger.error('Income prediction failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Run Python AI model
 */
const runPythonModel = (modelType, inputData) => {
  return new Promise((resolve) => {
    try {
      let scriptPath;
      
      switch (modelType) {
        case 'detect_anomaly':
          scriptPath = path.join(AI_MODEL_PATH, 'anomaly_detection_model', 'detect_anomaly.py');
          break;
        case 'classify_bpl':
          scriptPath = path.join(AI_MODEL_PATH, 'apl_bpl_model', 'classify_household.py');
          break;
        default:
          return resolve({ success: false, error: 'Unknown model type' });
      }
      
      const python = spawn('python', [scriptPath, JSON.stringify(inputData)]);
      
      let output = '';
      let errorOutput = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          logger.warn(`Python model exited with code ${code}:`, errorOutput);
          return resolve({ success: false, error: errorOutput });
        }
        
        try {
          const result = JSON.parse(output);
          resolve({ success: true, data: result });
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse model output' });
        }
      });
      
      python.on('error', (err) => {
        logger.warn('Python model not available:', err.message);
        resolve({ success: false, error: err.message });
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        python.kill();
        resolve({ success: false, error: 'Model timeout' });
      }, 10000);
      
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
};

export default {
  detectAnomaly,
  classifyBPL,
  predictIncome
};
