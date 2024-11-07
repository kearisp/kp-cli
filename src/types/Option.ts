export type Option = {
    name: string;
    type: "boolean" | "number" | "string";
    help?: boolean;
    alias?: string;
    description?: string;
    default?: boolean | string | number;
};

export type OptionValue = {
    name: string;
    value: boolean | string | number;
};
