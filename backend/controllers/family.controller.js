import { Family, User } from '../models/index.js';
import { logger } from '../utils/logger.util.js';
import { classifyHousehold } from '../services/ai.service.js';

export const familyController = {
  // Get current user's family information
  async getMyFamily(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get user with ration_no
      const user = await User.findById(userId);
      
      if (!user || !user.ration_no) {
        return res.json({
          success: true,
          data: {
            family: null,
            members: []
          }
        });
      }

      // Find family by ration number
      const family = await Family.findOne({ ration_no: user.ration_no });
      
      // Find all family members with the same ration number
      const members = await User.find(
        { ration_no: user.ration_no },
        { name: 1, email: 1, phone: 1 }
      );

      res.json({
        success: true,
        data: {
          family,
          members
        }
      });
    } catch (error) {
      logger.error('Error fetching family data:', error);
      next(error);
    }
  },

  // Check survey status
  async checkSurveyStatus(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get user with ration_no
      const user = await User.findById(userId);
      
      if (!user || !user.ration_no) {
        return res.json({
          success: true,
          data: {
            surveyCompleted: false,
            family: null,
            requiresUpdate: false,
            actualMemberCount: 0,
            registeredMemberCount: 0
          }
        });
      }

      // Check if family exists
      const family = await Family.findOne({ ration_no: user.ration_no });
      
      // Count actual users with this ration number
      const actualMemberCount = await User.countDocuments({ ration_no: user.ration_no });
      
      // Check if family size needs update or if update is required
      let requiresUpdate = false;
      let autoUpdated = false;
      
      if (family && family.family_size < actualMemberCount) {
        // Auto-increment family size and flag for ALL users to update
        family.family_size = actualMemberCount;
        family.requires_update = true;
        family.last_auto_update = new Date();
        await family.save();
        requiresUpdate = true;
        autoUpdated = true;
        logger.info(`Auto-updated family size for ration ${user.ration_no}: ${actualMemberCount} members - All users flagged for update`);
      } else if (family && family.requires_update) {
        // Check existing requires_update flag
        requiresUpdate = true;
      }

      res.json({
        success: true,
        data: {
          surveyCompleted: !!family,
          family,
          requiresUpdate,
          autoUpdated,
          actualMemberCount,
          registeredMemberCount: family ? family.family_size : 0
        }
      });
    } catch (error) {
      logger.error('Error checking survey status:', error);
      next(error);
    }
  },

  // Submit family survey
  async submitSurvey(req, res, next) {
    try {
      const userId = req.user.id;
      const surveyData = req.body;

      // Get user's ration number
      const user = await User.findById(userId);
      
      if (!user || !user.ration_no) {
        return res.status(400).json({
          success: false,
          message: 'User does not have a ration number assigned'
        });
      }

      // Check if family already exists for this ration number
      const existingFamily = await Family.findOne({ ration_no: user.ration_no });
      
      if (existingFamily) {
        return res.status(400).json({
          success: false,
          message: 'Family survey already completed for this ration number'
        });
      }

      // Run APL/BPL classification using AI model
      logger.info(`Running APL/BPL classification for ration number: ${user.ration_no}`);
      let classificationResult = null;
      
      try {
        classificationResult = await classifyHousehold(surveyData);
        logger.info(`Classification result: ${classificationResult?.classification}`);
      } catch (classifyError) {
        logger.error('Classification failed:', classifyError.message);
        // Continue without classification - will be marked as pending
      }

      // Prepare family data with classification results
      const familyData = {
        ...surveyData,
        ration_no: user.ration_no
      };

      // Add classification results if available
      if (classificationResult && classificationResult.success) {
        familyData.classification = classificationResult.classification;
        familyData.classification_reason = classificationResult.reason;
        familyData.classified_at = new Date();
        
        // ML prediction results
        if (classificationResult.ml_prediction) {
          familyData.ml_classification = classificationResult.ml_prediction.classification;
          familyData.classification_confidence = classificationResult.ml_prediction.confidence;
          familyData.ml_bpl_probability = classificationResult.ml_prediction.bpl_probability;
          familyData.ml_apl_probability = classificationResult.ml_prediction.apl_probability;
        }
        
        // SECC analysis results
        if (classificationResult.secc_analysis) {
          familyData.secc_classification = classificationResult.secc_analysis.secc_classification;
          familyData.secc_reason = classificationResult.secc_analysis.secc_reason;
          familyData.secc_has_exclusion = classificationResult.secc_analysis.has_exclusion;
          familyData.secc_has_inclusion = classificationResult.secc_analysis.has_inclusion;
          familyData.secc_deprivation_count = classificationResult.secc_analysis.deprivation_count;
          familyData.secc_exclusion_met = classificationResult.secc_analysis.exclusion_met || [];
          familyData.secc_inclusion_met = classificationResult.secc_analysis.inclusion_met || [];
          familyData.secc_deprivation_met = classificationResult.secc_analysis.deprivation_met || [];
        }
        
        // Recommendation
        if (classificationResult.recommendation) {
          familyData.recommendation_priority = classificationResult.recommendation.priority;
          familyData.recommendation_message = classificationResult.recommendation.message;
          familyData.eligible_schemes = classificationResult.recommendation.eligible_schemes || [];
        }
      }

      // Create new family record
      const family = new Family(familyData);
      await family.save();

      logger.info(`Family survey submitted for ration number: ${user.ration_no} - Classification: ${familyData.classification}`);

      res.status(201).json({
        success: true,
        message: 'Family survey submitted successfully',
        data: {
          family,
          classification: classificationResult
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        return res.status(400).json({
          success: false,
          message: 'A family with this ration number already exists'
        });
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(e => e.message)
        });
      }

      logger.error('Error submitting family survey:', error);
      next(error);
    }
  },

  // Get family by ration number
  async getFamilyByRation(req, res, next) {
    try {
      const { ration_no } = req.params;

      const family = await Family.findOne({ ration_no: parseInt(ration_no) });

      if (!family) {
        return res.status(404).json({
          success: false,
          message: 'Family not found'
        });
      }

      res.json({
        success: true,
        data: family
      });
    } catch (error) {
      logger.error('Error fetching family by ration:', error);
      next(error);
    }
  },

  // Update family details
  async updateFamily(req, res, next) {
    try {
      const { ration_no } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const { reclassify = true } = req.query; // Option to trigger reclassification

      // Verify user belongs to this family
      const user = await User.findById(userId);
      if (!user || user.ration_no !== parseInt(ration_no)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this family'
        });
      }

      // Don't allow changing ration_no
      delete updateData.ration_no;
      
      // Ensure family size matches actual member count
      const actualMemberCount = await User.countDocuments({ ration_no: parseInt(ration_no) });
      if (updateData.family_size && updateData.family_size < actualMemberCount) {
        updateData.family_size = actualMemberCount;
        logger.info(`Auto-corrected family size to match member count: ${actualMemberCount}`);
      }

      const family = await Family.findOneAndUpdate(
        { ration_no: parseInt(ration_no) },
        updateData,
        { new: true, runValidators: true }
      );

      if (!family) {
        return res.status(404).json({
          success: false,
          message: 'Family not found'
        });
      }

      // Clear requires_update flag since a member has updated the family
      if (family.requires_update) {
        family.requires_update = false;
        await family.save();
        logger.info(`Cleared requires_update flag for ration ${ration_no} after member update`);
      }
      
      logger.info(`Family updated for ration number: ${ration_no}`);
      
      // Optionally run reclassification after update
      let classificationResult = null;
      if (reclassify === 'true' || reclassify === true) {
        try {
          const surveyData = family.toObject();
          classificationResult = await classifyHousehold(surveyData);
          
          if (classificationResult && classificationResult.success) {
            family.classification = classificationResult.classification;
            family.classification_reason = classificationResult.reason;
            family.classified_at = new Date();
            
            if (classificationResult.ml_prediction) {
              family.ml_classification = classificationResult.ml_prediction.classification;
              family.classification_confidence = classificationResult.ml_prediction.confidence;
              family.ml_bpl_probability = classificationResult.ml_prediction.bpl_probability;
              family.ml_apl_probability = classificationResult.ml_prediction.apl_probability;
            }
            
            if (classificationResult.secc_analysis) {
              family.secc_classification = classificationResult.secc_analysis.secc_classification;
              family.secc_reason = classificationResult.secc_analysis.secc_reason;
              family.secc_has_exclusion = classificationResult.secc_analysis.has_exclusion;
              family.secc_has_inclusion = classificationResult.secc_analysis.has_inclusion;
              family.secc_deprivation_count = classificationResult.secc_analysis.deprivation_count;
              family.secc_exclusion_met = classificationResult.secc_analysis.exclusion_met || [];
              family.secc_inclusion_met = classificationResult.secc_analysis.inclusion_met || [];
              family.secc_deprivation_met = classificationResult.secc_analysis.deprivation_met || [];
            }
            
            if (classificationResult.recommendation) {
              family.recommendation_priority = classificationResult.recommendation.priority;
              family.recommendation_message = classificationResult.recommendation.message;
              family.eligible_schemes = classificationResult.recommendation.eligible_schemes || [];
            }
            
            await family.save();
            logger.info(`Family reclassified after update: ${ration_no} - ${family.classification}`);
          }
        } catch (classifyError) {
          logger.error('Reclassification after update failed:', classifyError.message);
          // Continue without classification
        }
      }

      res.json({
        success: true,
        message: 'Family details updated successfully',
        data: {
          family,
          classification: classificationResult
        }
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(e => e.message)
        });
      }

      logger.error('Error updating family:', error);
      next(error);
    }
  },

  // Get family members
  async getFamilyMembers(req, res, next) {
    try {
      const { ration_no } = req.params;

      const members = await User.find(
        { ration_no: parseInt(ration_no) },
        { name: 1, email: 1, phone: 1, role: 1, createdAt: 1 }
      );

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      logger.error('Error fetching family members:', error);
      next(error);
    }
  },

  // Get all families (for government officials)
  async getAllFamilies(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const query = {};
      if (search) {
        query.ration_no = { $regex: search, $options: 'i' };
      }

      const families = await Family.find(query)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await Family.countDocuments(query);

      res.json({
        success: true,
        data: {
          families,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching families:', error);
      next(error);
    }
  },

  // Get eligible families for welfare
  async getEligibleFamilies(req, res, next) {
    try {
      const { minScore = 20 } = req.query;

      const eligibleFamilies = await Family.findEligibleForWelfare(parseInt(minScore));

      res.json({
        success: true,
        data: eligibleFamilies
      });
    } catch (error) {
      logger.error('Error fetching eligible families:', error);
      next(error);
    }
  },

  // Reclassify an existing family
  async reclassifyFamily(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user's ration number
      const user = await User.findById(userId);
      
      if (!user || !user.ration_no) {
        return res.status(400).json({
          success: false,
          message: 'User does not have a ration number assigned'
        });
      }

      // Find existing family
      const family = await Family.findOne({ ration_no: user.ration_no });
      
      if (!family) {
        return res.status(404).json({
          success: false,
          message: 'Family survey not found. Please complete the survey first.'
        });
      }

      // Prepare survey data from existing family record
      const surveyData = family.toObject();
      
      // Run APL/BPL classification
      logger.info(`Reclassifying family with ration number: ${user.ration_no}`);
      let classificationResult = null;
      
      try {
        classificationResult = await classifyHousehold(surveyData);
        logger.info(`Reclassification result: ${classificationResult?.classification}`);
      } catch (classifyError) {
        logger.error('Reclassification failed:', classifyError.message);
        return res.status(500).json({
          success: false,
          message: 'Classification service unavailable. Please try again later.'
        });
      }

      // Update family with new classification results
      if (classificationResult && classificationResult.success) {
        family.classification = classificationResult.classification;
        family.classification_reason = classificationResult.reason;
        family.classified_at = new Date();
        
        // ML prediction results
        if (classificationResult.ml_prediction) {
          family.ml_classification = classificationResult.ml_prediction.classification;
          family.classification_confidence = classificationResult.ml_prediction.confidence;
          family.ml_bpl_probability = classificationResult.ml_prediction.bpl_probability;
          family.ml_apl_probability = classificationResult.ml_prediction.apl_probability;
        }
        
        // SECC analysis results
        if (classificationResult.secc_analysis) {
          family.secc_classification = classificationResult.secc_analysis.secc_classification;
          family.secc_reason = classificationResult.secc_analysis.secc_reason;
          family.secc_has_exclusion = classificationResult.secc_analysis.has_exclusion;
          family.secc_has_inclusion = classificationResult.secc_analysis.has_inclusion;
          family.secc_deprivation_count = classificationResult.secc_analysis.deprivation_count;
          family.secc_exclusion_met = classificationResult.secc_analysis.exclusion_met || [];
          family.secc_inclusion_met = classificationResult.secc_analysis.inclusion_met || [];
          family.secc_deprivation_met = classificationResult.secc_analysis.deprivation_met || [];
        }
        
        // Recommendation
        if (classificationResult.recommendation) {
          family.recommendation_priority = classificationResult.recommendation.priority;
          family.recommendation_message = classificationResult.recommendation.message;
          family.eligible_schemes = classificationResult.recommendation.eligible_schemes || [];
        }

        await family.save();

        logger.info(`Family reclassified successfully: ${user.ration_no} - ${family.classification}`);

        res.json({
          success: true,
          message: 'Family classification updated successfully',
          data: {
            family,
            classification: classificationResult
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Classification failed. Please try again.'
        });
      }
    } catch (error) {
      logger.error('Error reclassifying family:', error);
      next(error);
    }
  }
};

export default familyController;
