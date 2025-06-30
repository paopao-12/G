const express = require('express');
const app = express();
const transportRoutes = require('./routes/transportRoutes');
const routeMetrics = require('./routes/routeMetrics');
const authRoutes = require('./routes/authRoutes');
app.use(express.json()); // Middleware to parse JSON bodies
app.use('/', authRoutes);

// Routes
app.use('/api/transport', transportRoutes);
app.use('/api/route-metrics', routeMetrics);

// In-memory user store (for demo only)
const users = [];

// Signup endpoint
// app.post('/signup', (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: 'Email and password are required.' });
//   }
//   const userExists = users.find(u => u.email === email);
//   if (userExists) {
//     return res.status(409).json({ message: 'User already exists.' });
//   }
//   users.push({ email, password });
//   return res.status(201).json({ message: 'Signup successful.' });
// });

// // Login endpoint
// app.post('/login', (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: 'Email and password are required.' });
//   }
//   const user = users.find(u => u.email === email && u.password === password);
//   if (!user) {
//     return res.status(401).json({ message: 'Invalid credentials.' });
//   }
//   return res.status(200).json({ message: 'Login successful.' });
// });

module.exports = app;