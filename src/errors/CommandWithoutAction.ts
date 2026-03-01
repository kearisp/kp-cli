export class CommandWithoutAction extends Error {
    public constructor() {
        super("Command without action");
    }
}
