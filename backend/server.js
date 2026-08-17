require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all incoming requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/', (req, res) => {
  res.send('TMA Backend API is running!');
});

// =====================================================
// AUTH / USER ROUTES
// =====================================================

// Register User
app.post('/register', async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [fullname, email, password]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
      fullname
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error registering user' });
  }
});

// Login User
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    res.json({
      message: 'Login successful',
      userId: user.id,
      fullname: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error logging in' });
  }
});

// =====================================================
// TASK ROUTES
// =====================================================

// Get All Tasks for Logged-in User
app.get('/tasks/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [tasks] = await pool.query(
      'SELECT id, user_id, title, description, due_date, priority, status FROM tasks WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Failed to retrieve tasks', error: error.message });
  }
});

// Get Single Task by ID
app.get('/task/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [tasks] = await pool.query(
      'SELECT id, user_id, title, description, DATE_FORMAT(due_date, "%Y-%m-%d") AS due_date, priority, status FROM tasks WHERE id = ?',
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(tasks[0]);
  } catch (error) {
    console.error('Fetch single task error:', error);
    res.status(500).json({ message: 'Failed to retrieve task' });
  }
});

// Add New Task
app.post('/add-task', async (req, res) => {
  const { user_id, title, description, due_date, priority, status } = req.body;

  if (!title || !user_id) {
    return res.status(400).json({ message: 'Task title and User ID are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, description || '', due_date || null, priority || 'Low', status || 'Pending']
    );

    res.status(201).json({
      message: 'Task created successfully',
      taskId: result.insertId
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// Update Task
app.put('/update-task/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, priority, status } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, status = ? WHERE id = ?',
      [title, description, due_date || null, priority, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// Delete Task
app.delete('/delete-task/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// =====================================================
// SERVER INITIALIZATION
// =====================================================

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });