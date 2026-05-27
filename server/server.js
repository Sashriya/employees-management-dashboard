// server/server.js (ES Module with MongoDB)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ems', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// ========== MODELS ==========

// Employee Model
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String },
  phoneNumber: { type: String },
  location: { type: String },
  address: { type: String },
  status: { type: String, default: 'Active' },
  joinDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);

// Assignment Model
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: String },
  assignedDepartment: { type: String },
  assignedBy: { type: String, required: true },
  assignedByEmail: { type: String, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  deadline: { type: Date },
  completedAt: { type: Date },
  completedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

// Notification Model
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['assignment', 'completion', 'reminder'], required: true },
  assignmentId: { type: String },
  assignedTo: { type: String },
  department: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  department: { type: String },
  position: { type: String },
  phoneNumber: { type: String },
  location: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ========== EMPLOYEE ROUTES ==========

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const { limit = 100, page = 1, department } = req.query;
    const query = {};
    if (department) query.department = department;
    
    const employees = await Employee.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Employee.countDocuments(query);
    
    res.json({
      success: true,
      employees,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create employee
app.post('/api/employees', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get employee stats
app.get('/api/employees/stats', async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'Active' });
    const departments = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalEmployees: total,
        activeEmployees: active,
        departments: departments.map(d => ({ name: d._id, count: d.count }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ASSIGNMENT ROUTES ==========

// Get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const { department, employee, status } = req.query;
    const query = {};
    if (department) query.assignedDepartment = department;
    if (employee) query.assignedTo = employee;
    if (status) query.status = status;
    
    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get assignment by ID
app.get('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create assignment
app.post('/api/assignments', async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();
    
    // Create notification
    const notification = new Notification({
      message: `New task assigned: ${assignment.title}`,
      type: 'assignment',
      assignmentId: assignment.id,
      assignedTo: assignment.assignedTo,
      department: assignment.assignedDepartment
    });
    await notification.save();
    
    // Emit socket event
    io.emit('assignment-created', assignment);
    
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update assignment status
app.patch('/api/assignments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        updatedAt: new Date(),
        completedAt: status === 'Completed' ? new Date() : null
      },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    // Create notification for completion
    if (status === 'Completed') {
      const notification = new Notification({
        message: `Task "${assignment.title}" has been completed`,
        type: 'completion',
        assignmentId: assignment.id,
        assignedTo: assignment.assignedBy
      });
      await notification.save();
    }
    
    // Emit socket event
    io.emit('assignment-updated', assignment);
    
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete assignment
app.delete('/api/assignments/:id', async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== NOTIFICATION ROUTES ==========

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { assignedTo, department } = req.query;
    const query = {};
    if (assignedTo) query.assignedTo = assignedTo;
    if (department) query.department = department;
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear all notifications
app.delete('/api/notifications', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== AUTH ROUTES ==========

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    // Create employee record
    const employee = new Employee({
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      department: user.department,
      position: user.position,
      phoneNumber: user.phoneNumber,
      location: user.location,
      address: user.address
    });
    await employee.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SOCKET.IO CONNECTION ==========

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('user-connected', (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`User ${userData.email} connected. Total: ${connectedUsers.size}`);
  });
  
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log(`Client disconnected. Total: ${connectedUsers.size}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for real-time updates`);
});