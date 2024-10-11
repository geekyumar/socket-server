const WebSocket = require('ws');
const os = require('os');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send memory and load average stats at regular intervals
    const intervalId = setInterval(() => {
        // Accurate CPU usage percentage
        const startTime = os.cpus().map(cpu => cpu.times);

        setTimeout(() => {
            const endTime = os.cpus().map(cpu => cpu.times);
            let idleDiff = 0, totalDiff = 0;

            for (let i = 0; i < startTime.length; i++) {
                const start = startTime[i];
                const end = endTime[i];

                const idleStart = start.idle;
                const idleEnd = end.idle;

                const totalStart = Object.values(start).reduce((acc, val) => acc + val, 0);
                const totalEnd = Object.values(end).reduce((acc, val) => acc + val, 0);

                idleDiff += idleEnd - idleStart;
                totalDiff += totalEnd - totalStart;
            }

            const cpuUsagePercentage = 100 - (100 * idleDiff / totalDiff);

            const totalMem = os.totalmem(); // Total memory in bytes
            const freeMem = os.freemem();   // Free memory in bytes

            // Calculate used memory (in bytes)
            const usedMem = totalMem - freeMem;

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
        }, 1000); // Collect CPU info after 1 second

    }, 1000); // Sends stats every 2 seconds

    // Clear the interval when the connection is closed
    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
});

console.log('WebSocket server is running on ws://localhost:3000');