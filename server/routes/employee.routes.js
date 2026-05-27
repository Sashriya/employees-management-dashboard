import express from 'express';
import { body } from 'express-validator';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all employee routes
router.use(authMiddleware);

// Validation rules for employee
const employeeValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('status').optional().isIn(['Active', 'Inactive', 'On Leave']),
];

router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', employeeValidation, createEmployee);
router.put('/:id', employeeValidation, updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;