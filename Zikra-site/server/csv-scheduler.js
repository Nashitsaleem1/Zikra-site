// Import required modules for CSV update scheduling
import { exec } from 'child_process';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schedule CSV update every day at 3:00 AM
// This uses cron syntax: minute hour day month day-of-week
cron.schedule('0 3 * * *', () => {
    console.log('Running scheduled CSV update: ' + new Date().toISOString());
    
    // Run the update-csv.js script
    const updateScriptPath = path.join(__dirname, 'update-csv.js');
    exec(`node ${updateScriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`CSV update error: ${error.message}`);
            return;
        }
        
        if (stderr) {
            console.error(`CSV update stderr: ${stderr}`);
            return;
        }
        
        console.log(`CSV update completed: ${stdout}`);
    });
}, {
    scheduled: true,
    timezone: "Asia/Karachi" // Set to your local timezone
});

console.log('YouTube CSV update scheduler initialized');
