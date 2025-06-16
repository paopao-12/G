const express = require('express');
const app = express();
const transportRoutes = require('./routes/transportRoutes');
const routeMetrics = require('./routes/routeMetrics');

// Routes
app.use('/api/transport', transportRoutes);
app.use('/api/route-metrics', routeMetrics);

// ... existing code ... 