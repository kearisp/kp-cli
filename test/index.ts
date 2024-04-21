import {Logger} from "../src/makes/Logger";


console.log = (...args: any[]) => {
    Logger.log(...args);
};

console.info = (...args: any[]) => {
    Logger.info(...args);
};

console.warn = (...args: any[]) => {
    Logger.warn(...args);
};

console.error = (...args: any[]) => {
    Logger.error(...args);
};

console.debug = (...args) => {
    Logger.debug(...args);
};
