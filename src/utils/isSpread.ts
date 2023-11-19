export const isSpread = (command: string) => {
    const comSpread = /^\[\.\.\.([0-9\w_-]+)]$|^<\.\.\.([0-9\w_-]+)>$/;

    return comSpread.test(command);
};
