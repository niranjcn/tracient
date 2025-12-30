/**
 * Family Routes
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { familyController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

/**
 * @route GET /api/family/my-family
 * @desc Get current user's family information
 * @access Private (Worker, Employer)
 */
router.get(
  '/my-family',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER),
  familyController.getMyFamily
);

/**
 * @route GET /api/family/survey-status
 * @desc Check if family survey is completed
 * @access Private (Worker, Employer)
 */
router.get(
  '/survey-status',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER),
  familyController.checkSurveyStatus
);

/**
 * @route POST /api/family/survey
 * @desc Submit family survey
 * @access Private (Worker, Employer)
 */
router.post(
  '/survey',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER),
  [
    // ration_no is auto-assigned from user, no validation needed
    body('family_size')
      .isInt({ min: 1, max: 20 })
      .withMessage('Family size must be between 1 and 20'),
    body('head_age')
      .isInt({ min: 18, max: 100 })
      .withMessage('Head age must be between 18 and 100'),
    validate
  ],
  familyController.submitSurvey
);

/**
 * @route GET /api/family/ration/:ration_no
 * @desc Get family by ration number
 * @access Private (Worker, Employer, Government)
 */
router.get(
  '/ration/:ration_no',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER, ROLES.GOVERNMENT),
  familyController.getFamilyByRation
);

/**
 * @route PUT /api/family/ration/:ration_no
 * @desc Update family details
 * @access Private (Worker, Employer)
 */
router.put(
  '/ration/:ration_no',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER),
  familyController.updateFamily
);

/**
 * @route GET /api/family/ration/:ration_no/members
 * @desc Get all family members by ration number
 * @access Private (Worker, Employer, Government)
 */
router.get(
  '/ration/:ration_no/members',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER, ROLES.GOVERNMENT),
  familyController.getFamilyMembers
);

/**
 * @route GET /api/family/all
 * @desc Get all families (paginated)
 * @access Private (Government, Admin)
 */
router.get(
  '/all',
  authenticate,
  authorize(ROLES.GOVERNMENT, ROLES.ADMIN),
  familyController.getAllFamilies
);

/**
 * @route GET /api/family/eligible
 * @desc Get welfare-eligible families
 * @access Private (Government)
 */
router.get(
  '/eligible',
  authenticate,
  authorize(ROLES.GOVERNMENT, ROLES.ADMIN),
  familyController.getEligibleFamilies
);

/**
 * @route POST /api/family/reclassify
 * @desc Reclassify current user's family using AI model
 * @access Private (Worker, Employer)
 */
router.post(
  '/reclassify',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER),
  familyController.reclassifyFamily
);

export default router;
