export type Option = {
    name: string;
    type: "string" | "boolean" | "number";
    help?: boolean;
    alias?: string;
    description?: string;
    default?: string | boolean | number;
};
