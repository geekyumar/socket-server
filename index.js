const WebSocket = require('ws');
const os = require('os');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send memory and load average stats at regular intervals
    const intervalId = setInterval(() => {
        // Get CPU usage percentage
        const cpuInfo = os.cpus();
        const totalCores = cpuInfo.length;
        let totalIdle = 0;
        let totalTick = 0;

        cpuInfo.forEach((core) => {
            totalIdle += core.times.idle;
            totalTick += Object.values(core.times).reduce((acc, curr) => acc + curr, 0);
        });

        const cpuUsagePercentage = ((totalTick - totalIdle) / totalTick) * 100;

        // Get memory information
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsagePercentage = ((totalMem - freeMem) / totalMem) * 100;

        // Get the load averages for 1, 5, and 15 minutes
        const loadAvg = os.loadavg(); // This returns an array [1min, 5min, 15min]

        const stats = {
            cpu: cpuUsagePercentage.toFixed(2), // CPU usage percentage
            memory: memoryUsagePercentage.toFixed(2), // Memory usage percentage
            loadAvg: loadAvg // Load averages as an array
        };

        console.log('Sending stats:', stats); // Log the stats being sent

        // Check if the connection is still open before sending
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(stats));
        }
    }, 2000); // Sends stats every 5 seconds

    // Clear the interval when the connection is closed
    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
});

console.log('WebSocket server is running on ws://localhost:8080');