const express = require('express');
const path = require('path');
const cors = require('cors');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../html')));

// Routes
app.use('/api/config', configRoutes);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 