import {escapeRegExp} from "./escapeRegExp";


export const generateCommandRegExp = (part: string, partial = false) => {
    // const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if(partial) {
        const comAttrReq = /^<([\w_-]+)>(.*)?$/;
        const comAttrOpt = /^\[([\w_-]+)](.*)?$/;
        const comSpread = /^\[\.\.\.([0-9\w_-]+)](.*)$/;
        const comOther = /^([^[\]<>{}])(.*)$/;

        let exitCount = 0;
        let restCommand = part;
        let res = "";
        let partialRes = "";

        while(restCommand) {
            let stepReg;

            if(comAttrReq.test(restCommand)) {
                const [, name, rest] = comAttrReq.exec(restCommand) || [];

                restCommand = rest;
                stepReg = partial ? `(?:.+?)` : `(.+?)`;
            }
            else if(comAttrOpt.test(restCommand)) {
                const [, name, rest] = comAttrReq.exec(restCommand) || [];

                restCommand = rest;
                stepReg = partial ? `(?:.+?)?` : `(.+?)?`;
            }
            else if(comOther.test(restCommand)) {
                const [, match, rest] = comOther.exec(restCommand) || [];

                restCommand = rest;
                stepReg = `${escapeRegExp(match)}`;
            }
            else {
                return null;
            }

            if(stepReg) {
                res += stepReg;
                partialRes = `${res}${"|" + partialRes}`;
            }

            if(exitCount++ > 1000) {
                break;
            }
        }

        return new RegExp(`^(?:${partial ? partialRes : res})$`);
    }

    const regExpString = part
        .replace(/<([^>]+)>/g, '(.+?)')
        .replace(/\[([^\]]+)]/g, "(.+?)?")
        .replace(/\.\.\./g, '(.*)');

    return new RegExp(`^${regExpString}$`);
};