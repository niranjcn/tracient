import { logger } from './logger.util.js';

// BPL threshold from environment or default
const BPL_THRESHOLD = parseInt(process.env.BPL_THRESHOLD) || 120000;

/**
 * BPL Classification Result
 * @typedef {Object} BPLResult
 * @property {string} category - 'BPL' or 'APL'
 * @property {boolean} isBPL - true if below poverty line
 * @property {number} annualIncome - calculated annual income
 * @property {number} monthlyIncome - average monthly income
 * @property {number} threshold - BPL threshold used
 * @property {number} incomeGap - difference from threshold
 * @property {number} percentOfThreshold - income as percentage of threshold
 * @property {string[]} eligibleSchemes - list of eligible welfare schemes
 */

/**
 * Calculate BPL status from wage records
 * @param {Array} wageRecords - Array of wage transactions
 * @param {number} months - Number of months to consider (default: 12)
 * @returns {BPLResult}
 */
export const calculateBPLStatus = (wageRecords, months = 12) => {
  try {
    if (!wageRecords || wageRecords.length === 0) {
      return {
        category: 'BPL',
        isBPL: true,
        annualIncome: 0,
        monthlyIncome: 0,
        threshold: BPL_THRESHOLD,
        incomeGap: BPL_THRESHOLD,
        percentOfThreshold: 0,
        eligibleSchemes: getAllSchemes()
      };
    }

    // Filter records for the specified period
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const relevantRecords = wageRecords.filter(record => {
      const recordDate = new Date(record.date || record.timestamp || record.createdAt);
      return recordDate >= cutoffDate;
    });

    // Calculate total income
    const totalIncome = relevantRecords.reduce((sum, record) => {
      return sum + (parseFloat(record.amount) || 0);
    }, 0);

    // Annualize if less than 12 months of data
    const actualMonths = relevantRecords.length > 0 
      ? Math.min(months, getMonthSpan(relevantRecords))
      : 1;
    
    const monthlyIncome = totalIncome / Math.max(actualMonths, 1);
    const annualIncome = monthlyIncome * 12;

    // Determine category
    const isBPL = annualIncome < BPL_THRESHOLD;
    const category = isBPL ? 'BPL' : 'APL';

    // Calculate income gap
    const incomeGap = BPL_THRESHOLD - annualIncome;
    const percentOfThreshold = (annualIncome / BPL_THRESHOLD) * 100;

    // Determine eligible schemes
    const eligibleSchemes = getEligibleSchemes(annualIncome, isBPL);

    const result = {
      category,
      isBPL,
      annualIncome: Math.round(annualIncome * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      threshold: BPL_THRESHOLD,
      incomeGap: Math.round(incomeGap * 100) / 100,
      percentOfThreshold: Math.round(percentOfThreshold * 100) / 100,
      eligibleSchemes,
      recordsAnalyzed: relevantRecords.length,
      periodMonths: actualMonths
    };

    logger.debug('BPL calculation result:', result);
    return result;
  } catch (error) {
    logger.error('Error calculating BPL status:', error);
    throw error;
  }
};

/**
 * Get the span of months covered by wage records
 */
const getMonthSpan = (records) => {
  if (records.length === 0) return 0;

  const dates = records.map(r => new Date(r.date || r.timestamp || r.createdAt));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const monthDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 
    + (maxDate.getMonth() - minDate.getMonth()) + 1;

  return monthDiff;
};

/**
 * Get all welfare schemes
 */
const getAllSchemes = () => [
  'food_subsidy',
  'housing_assistance',
  'education_grant',
  'health_insurance',
  'employment_guarantee',
  'skill_development',
  'pension_scheme'
];

/**
 * Get eligible schemes based on income
 */
const getEligibleSchemes = (annualIncome, isBPL) => {
  const schemes = [];

  if (isBPL) {
    // Full BPL benefits
    schemes.push(
      'food_subsidy',
      'housing_assistance',
      'education_grant',
      'health_insurance',
      'employment_guarantee'
    );
  }

  // Income-based additional schemes
  if (annualIncome < 50000) {
    schemes.push('pension_scheme');
  }

  if (annualIncome < 100000) {
    schemes.push('skill_development');
  }

  return [...new Set(schemes)]; // Remove duplicates
};

/**
 * Calculate income trend over time
 */
export const calculateIncomeTrend = (wageRecords, periods = 6) => {
  try {
    if (!wageRecords || wageRecords.length < 2) {
      return {
        trend: 'insufficient_data',
        changePercent: 0,
        periodData: []
      };
    }

    // Group by month
    const monthlyData = {};
    wageRecords.forEach(record => {
      const date = new Date(record.date || record.timestamp || record.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = 0;
      }
      monthlyData[key] += parseFloat(record.amount) || 0;
    });

    // Sort and get last N periods
    const sortedKeys = Object.keys(monthlyData).sort().slice(-periods);
    const periodData = sortedKeys.map(key => ({
      period: key,
      income: Math.round(monthlyData[key] * 100) / 100
    }));

    // Calculate trend
    if (periodData.length < 2) {
      return { trend: 'insufficient_data', changePercent: 0, periodData };
    }

    const firstPeriod = periodData[0].income;
    const lastPeriod = periodData[periodData.length - 1].income;
    const changePercent = firstPeriod > 0 
      ? ((lastPeriod - firstPeriod) / firstPeriod) * 100 
      : 0;

    let trend;
    if (changePercent > 10) trend = 'increasing';
    else if (changePercent < -10) trend = 'decreasing';
    else trend = 'stable';

    return {
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      periodData
    };
  } catch (error) {
    logger.error('Error calculating income trend:', error);
    throw error;
  }
};

/**
 * Predict future BPL status
 */
export const predictBPLStatus = (currentBPL, trend) => {
  const predictions = {
    current: currentBPL.category,
    nextMonth: currentBPL.category,
    nextQuarter: currentBPL.category,
    confidence: 'low'
  };

  if (trend.trend === 'increasing' && currentBPL.isBPL) {
    if (currentBPL.percentOfThreshold > 80) {
      predictions.nextQuarter = 'APL';
      predictions.confidence = 'medium';
    }
  } else if (trend.trend === 'decreasing' && !currentBPL.isBPL) {
    if (currentBPL.percentOfThreshold < 120) {
      predictions.nextQuarter = 'BPL';
      predictions.confidence = 'medium';
    }
  } else if (trend.trend === 'stable') {
    predictions.confidence = 'high';
  }

  return predictions;
};

export default {
  calculateBPLStatus,
  calculateIncomeTrend,
  predictBPLStatus,
  BPL_THRESHOLD
};
