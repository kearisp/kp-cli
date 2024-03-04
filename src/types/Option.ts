export type Option = {
    name: string;
    type: "string" | "boolean" | "number";
    alias?: string;
    description?: string;
    default?: string | boolean | number;
};
