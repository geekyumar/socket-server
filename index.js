const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const os = require('os');

// Check if SSL certificate files exist
const certPath = '/etc/letsencrypt/live/labs.umarfarooq.cloud/fullchain.pem';
const keyPath = '/etc/letsencrypt/live/labs.umarfarooq.cloud/privkey.pem';
const sslAvailable = fs.existsSync(certPath) && fs.existsSync(keyPath);

// Create HTTP server (used for both development and WS in production)
const httpServer = http.createServer();

// Create HTTPS server (only in production if SSL is available)
let httpsServer;
if (sslAvailable) {
    httpsServer = https.createServer({
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
    });
} else {
    console.log('SSL certificates not found. Skipping WSS setup.');
}

// Create WebSocket servers for WS and WSS
const ws = new WebSocket.Server({ server: httpServer });
const wss = sslAvailable ? new WebSocket.Server({ server: httpsServer }) : null;

// Common logic to send CPU and memory stats
const sendStats = (wsClient) => {
    const intervalId = setInterval(() => {
        const startTime = os.cpus().map(cpu => cpu.times);

        setTimeout(() => {
            const endTime = os.cpus().map(cpu => cpu.times);
            let idleDiff = 0, totalDiff = 0;

            for (let i = 0; i < startTime.length; i++) {
                const start = startTime[i];
                const end = endTime[i];

                idleDiff += end.idle - start.idle;
                totalDiff += Object.values(end).reduce((acc, val) => acc + val, 0) -
                             Object.values(start).reduce((acc, val) => acc + val, 0);
            }

            const cpuUsagePercentage = 100 - (100 * idleDiff / totalDiff);
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;

            const stats = {
                cpu: cpuUsagePercentage.toFixed(2) + '%',
                totalMemory: `${(totalMem / (1024 ** 3)).toFixed(2)} GB`,
                usedMemory: `${(usedMem / (1024 ** 3)).toFixed(2)} GB`,
                freeMemory: `${(freeMem / (1024 ** 3)).toFixed(2)} GB`,
                memoryUsage: `${((usedMem / totalMem) * 100).toFixed(2)}%`,
                loadAvg: os.loadavg().map(avg => avg.toFixed(2))
            };

            if (wsClient.readyState === WebSocket.OPEN) {
                wsClient.send(JSON.stringify(stats));
            }
        }, 1000); // Measure CPU usage after 1 second

    }, 1000); // Send stats every second

    wsClient.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
};

// Handle WS connections
ws.on('connection', (wsClient) => {
    console.log('Client connected via WS');
    sendStats(wsClient);
});

// Handle WSS connections (if enabled)
if (wss) {
    wss.on('connection', (wsClient) => {
        console.log('Client connected via WSS');
        sendStats(wsClient);
    });
}

// Start HTTP server for WS on port 4000
httpServer.listen(4000, () => {
    console.log('WS server running on ws://localhost:4000');
});

// Start HTTPS server for WSS on port 3000 (if SSL available)
if (httpsServer) {
    httpsServer.listen(3000, () => {
        console.log('WSS server running on wss://localhost:3000');
    });
}