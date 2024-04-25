import * as OS from "os";
import * as Path from "path";
import * as FS from "fs";


export class Logger {
    protected static active: boolean = false;

    public static log(...args: any[]): void {
        Logger._log("log", ...args);
    }

    public static debug(...args: any[]): void {
        Logger._log("debug", ...args);
    }

    public static info(...data: any[]): void {
        this._log("info", ...data);
    }

    public static warn(...args: any): void {
        Logger._log("warn", ...args);
    }

    public static error(...args: any[]): void {
        Logger._log("error", ...args);
    }

    protected static _log(type: string, ...data: any[]): void {
        if(process.env.KP_LOG === "disable" || !Logger.active) {
            return;
        }

        const DATA_DIR = process.env.WS_PATH || Path.join(OS.homedir(), ".workspace");
        const LOG_FILE = Path.join(DATA_DIR, "ws.log");

        const getFormatedTime = (): string => {
            const prepareValue = (value: number): string => {
                if(value < 9) {
                    return `0${value}`;
                }

                return `${value}`;
            };

            const date = new Date(),
                year = date.getFullYear(),
                month = prepareValue(date.getMonth() + 1),
                days = prepareValue(date.getDate()),
                hours = prepareValue(date.getHours()),
                minutes = prepareValue(date.getMinutes()),
                seconds = prepareValue(date.getSeconds());

            return `${year}-${month}-${days} ${hours}:${minutes}:${seconds}`;
        };

        const logData = data.map((item) => {
            return typeof item !== "string" ? JSON.stringify(item) : item;
        }).join(" ");

        if(!FS.existsSync(LOG_FILE)) {
            FS.writeFileSync(LOG_FILE, "");
        }

        FS.appendFileSync(LOG_FILE, `[${getFormatedTime()}] ${type}: ${logData}\n`);
    }

    public static mute(): void {
        Logger.active = false;
    }

    public static unmute(): void {
        Logger.active = true;
    }
}
