const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});

// Set socket timeout to 2 minutes to allow large responses to send
server.setTimeout(120000);

