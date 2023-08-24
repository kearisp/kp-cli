import {generateCommandRegExp} from "./generateCommandRegExp";


export const isCommand = (command: string) => {
    // return !part.startsWith("-");
    return !!generateCommandRegExp(command);
};