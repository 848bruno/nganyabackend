
export class LogsService {

    private readonly logFilePath = 'logs/app.log';
    private readonly fs = require('fs');
    private readonly path = require('path');

    constructor() {
        // Ensure the logs directory exists
        const dir = this.path.dirname(this.logFilePath);
        if (!this.fs.existsSync(dir)) {
            this.fs.mkdirSync(dir, { recursive: true });
        }
    }

    async logToFile(message: string, clientIp: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${clientIp}] ${message}\n`;
        return new Promise((resolve, reject) => {
            this.fs.appendFile(this.logFilePath, logEntry, (err: NodeJS.ErrnoException | null) => {
                if (err) {
                    console.error('Failed to write log:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
