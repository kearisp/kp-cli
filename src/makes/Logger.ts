import * as Path from "path";
import * as FS from "fs";
import * as fns from "date-fns";


class Logger {
    static log(...data: any[]) {
        Logger._log("log", ...data);
    }

    static info(...data: any[]) {
        Logger._log("info", ...data);
    }

    static warning(...data: any[]) {
        Logger._log("warning", ...data);
    }

    static error(...data: any[]) {
        Logger._log("error", ...data);
    }

    static _log(type: string, ...data: any[]) {
        const time = fns.format(new Date(), "yyyy-MM-dd hh:mm:ss");
        const logPath = Path.join(
            process.env.LOG_PATH || "./",
            process.env.LOG_FILE || "cli.log"
        );

        const logData = data.map((item) => {
            return typeof item !== "string"
                ? JSON.stringify(item)
                : item;
        }).join(" ");

        if(!FS.existsSync(logPath)) {
            FS.writeFileSync(logPath, "");
        }

        FS.appendFileSync(logPath, `[${time}] ${type}: ${logData}\n`);
    }
}


export {Logger};
