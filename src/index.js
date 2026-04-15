const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Montar rutas
app.use('/api/stores', require('./routes/stores'));
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/cart', require('./routes/cart'));

// Solo levanta el servidor si se ejecuta directamente (no en tests)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;