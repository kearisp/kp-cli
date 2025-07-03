export type OptionType = boolean | string | number;

export type Option = {
    name: string;
    alias?: string;
    type: "boolean" | "number" | "string";
    help?: boolean;
    description?: string;
    default?: OptionType;
};

export type OptionValue = {
    name: string;
    value: OptionType;
};
