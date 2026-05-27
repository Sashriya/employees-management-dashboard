import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
    enum: ['HR', 'IT', 'Finance', 'Marketing', 'Sales', 'Operations'],
  },
  position: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
    min: 0,
  },
  hireDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

employeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;