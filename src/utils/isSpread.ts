export const isSpread = (command: string): boolean => {
    const comSpread = /^\[\.\.\.([0-9\w_-]+)]$|^<\.\.\.([0-9\w_-]+)>$/;

    return comSpread.test(command);
};
