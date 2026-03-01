const fullReg = /^--(\w[\w0-9_-]*)$/,
      shortReg = /^-(\w)$/,
      regWithoutValue = /^-(?:-(\w[\w0-9_-]*)|(\w+))$/,
      regWithValue = /^-(?:-(\w[\w0-9_-]*)|(\w))=(.*)$/,
      shortMultiple = /^-(\w+)$/;

export class OptionParser {
    public static isSingleWithoutValue(arg: string): boolean {
        return fullReg.test(arg)
            || shortReg.test(arg);
    }

    public static isSingleWithValue(arg: string): boolean {
        return regWithValue.test(arg);
    }

    public static isMultiple(arg: string): boolean {
        return shortMultiple.test(arg);
    }

    public static isOptionWithValue(arg: string): boolean {
        return regWithValue.test(arg);
    }

    public static parse(arg: string) {
        const [, name, alias] = regWithoutValue.exec(arg) || [];

        return {name, alias};
    }

    public static parseWithValue(arg: string) {
        const [, name, alias, value] = regWithValue.exec(arg);

        return {name, alias, value};
    }
}
