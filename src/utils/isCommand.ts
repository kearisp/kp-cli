import {generateCommandRegExp} from "./generateCommandRegExp";


export const isCommand = (command: string): boolean => {
    // return !part.startsWith("-");
    return !!generateCommandRegExp(command);
};