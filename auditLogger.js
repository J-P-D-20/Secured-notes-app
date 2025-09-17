
import fs from 'fs/promises';

const LOG_FILE = './audit.log';

export async function logEvent(username, action, status = "") {
    const timestamp = new Date().toISOString().split("T")[0];
    const logEntry = `${timestamp} - User: ${username}, Action: ${action}, Status: ${status}\n`;

    try {
         const logs  = await fs.appendFile(LOG_FILE, logEntry);
    } catch (err) {
        console.error("Error writing to log file", err);
    }
}


export async function readLogs() {
    try{
        const logs = await fs.readFile(LOG_FILE,'utf-8'); 
        return logs
    } catch (err) {
        console.error("Error viewing logs: ", err);
    }
}

