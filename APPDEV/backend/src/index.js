const express = require('express');
const cors = require('cors');
const transportRoutes = require('./routes/transportRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/', authRoutes);

// Routes
app.use('/api/transport', transportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});