import { Family, User } from '../models/index.js';
import { logger } from '../utils/logger.util.js';

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
            family: null
          }
        });
      }

      // Check if family exists
      const family = await Family.findOne({ ration_no: user.ration_no });

      res.json({
        success: true,
        data: {
          surveyCompleted: !!family,
          family
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

      // Create new family record with user's ration number
      const family = new Family({
        ...surveyData,
        ration_no: user.ration_no // Use user's ration number
      });
      await family.save();

      logger.info(`Family survey submitted for ration number: ${surveyData.ration_no}`);

      res.status(201).json({
        success: true,
        message: 'Family survey submitted successfully',
        data: family
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

      logger.info(`Family updated for ration number: ${ration_no}`);

      res.json({
        success: true,
        message: 'Family details updated successfully',
        data: family
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
  }
};

export default familyController;
