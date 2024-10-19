import {Logger} from "../src";


console.log = (...args: any[]): void => {
    Logger.log(...args);
};

console.info = (...args: any[]): void => {
    Logger.info(...args);
};

console.warn = (...args: any[]): void => {
    Logger.warn(...args);
};

console.error = (...args: any[]): void => {
    Logger.error(...args);
};

console.debug = (...args: any[]): void => {
    Logger.debug(...args);
};
