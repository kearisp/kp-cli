export type ArgumentDefinitionMeta = {
    spread: false;
    names: string[];
    regex: RegExp;
    partRegex: RegExp;
};

export type SpreadDefinitionMeta = {
    spread: true;
    names: string[];
    required: boolean;
};

export type DefinitionMeta = ArgumentDefinitionMeta | SpreadDefinitionMeta;
