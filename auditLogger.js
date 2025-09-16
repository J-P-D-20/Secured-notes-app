import fs from 'fs/promises';

const LOG_FILE = './audit.log';

export async function logEvent(username, action, status = "") {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - User: ${username}, Action: ${action}, Status: ${status}\n`;

    try {
        await fs.appendFile(LOG_FILE, logEntry);
    } catch (err) {
        console.error("Error writing to log file", err);
    }
}

