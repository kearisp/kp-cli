export const isCommand = (part: string) => {
    return !part.startsWith("-");
};