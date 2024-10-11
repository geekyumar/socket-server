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

        const totalMem = os.totalmem(); // Total memory in bytes
const freeMem = os.freemem();   // Free memory in bytes

// Available memory includes free memory plus memory used by buffers and caches
const usedMem = totalMem - freeMem; // Memory used (without cache/buffer distinction)

// Convert memory values to GB
const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(2);  // Total memory in GB
const usedMemGB = (usedMem / (1024 * 1024 * 1024)).toFixed(2);    // Used memory in GB
const freeMemGB = (freeMem / (1024 * 1024 * 1024)).toFixed(2);    // Free memory in GB

// Calculate memory usage percentage
const memoryUsagePercentage = ((usedMem / totalMem) * 100).toFixed(2);

// Get the load averages for 1, 5, and 15 minutes and round to 2 decimal places
const loadAvg = os.loadavg().map(avg => avg.toFixed(2)); 

        const stats = {
            cpu: cpuUsagePercentage.toFixed(2) + '%', // CPU usage percentage
            totalMemory: `${totalMemGB} GB`,
            usedMemory: `${usedMemGB} GB`,
            freeMemory: `${freeMemGB} GB`,
            memoryUsage: `${memoryUsagePercentage}%`, 
            loadAvg: loadAvg 
        };

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