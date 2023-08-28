/**
 * Visibility configuration.
 */
export interface IVisibilityOptions {
    showLabels : boolean;
    showOrbits : boolean;
    showInfo : boolean;
    showSun : boolean;
    showMoon : boolean;
    showEclipses: boolean;
    showLinesLatitude : boolean;
    showLinesLongitude : boolean;
};

export interface IOrbitOptions {
    orbitsForward : number;
    orbitsBackward : number;
    orbitsStep : number;
};

export interface IGridOptions {
    stepMode : boolean;
    latitudeLinesLatitude : number[];
    latitudeLinesLongitude : number[];
    latitudeLinesLatitudeStep : number;
    latitudeLinesLongitudeStep : number;
};

/**
 * Configuration.
 */
export interface IConfiguration {
    visibility : IVisibilityOptions;
    gridOptions : IGridOptions;
    orbitsOptions : IOrbitOptions;
};

/**
 * Default configuration.
 */
/*export const defaultConfiguration : IConfiguration = {
    visibility : {
        showLabels : false,
        showOrbits : true,
        showInfo : true,
        showSun : true,
        showMoon : false,
        showEclipses: false,
        showLinesLatitude : true,
        showLinesLongitude : true
    },
    gridOptions : {
        stepMode : true,
        latitudeLinesLatitude : [],
        latitudeLinesLongitude : [],
        latitudeLinesLatitudeStep : 15,
        latitudeLinesLongitudeStep : 15
    },
    orbitsOptions : {
        orbitsStep : 0.01,
        orbitsForward : 1,
        orbitsBackward : 1
    }
};*/

export enum OptionType {
    OPTION_BOOLEAN,
    OPTION_FIELD_FLOAT,
    OPTION_FIELD_INTEGER,
    OPTION_RANGE_FLOAT,
    OPTION_RANGE_INTEGER,
    OPTION_ARRAY,
    OPTION_STRING
};

export interface IOption {
    optionType : OptionType;
    caption : string;
    booleanValue? : boolean;
    numberValue? : number;
    arrayValue? : number[];
    stringValue? : string;
    minValue? : number;
    stepSize? : number;
    maxValue? : number;
}

export type ConfigurationData = {
    [key : string] : IOption;
};

export class Configuration {
    /**
     * Public constructor.
     */
    constructor() {
        this.data = {};
    }

    addBoolean(name : string, caption : string, value : boolean) {
        this.data[name] = {
            optionType : OptionType.OPTION_BOOLEAN,
            caption : caption,
            booleanValue : value
        };
    }

    addFieldInteger(name : string, caption : string, value : number, minValue : number, maxValue : number) {
        this.data[name] = {
            optionType : OptionType.OPTION_FIELD_INTEGER,
            caption : caption,
            numberValue : value,
            minValue : minValue,
            maxValue : maxValue
        };
    }

    addFieldFloat(name : string, caption : string, value : number, minValue : number, maxValue : number) {
        this.data[name] = {
            optionType : OptionType.OPTION_FIELD_FLOAT,
            caption : caption,
            numberValue : value,
            minValue : minValue,
            maxValue : maxValue
        };
    }

    addRangeInteger(name : string, caption : string, value : number, minValue : number, maxValue : number) {
        this.data[name] = {
            optionType : OptionType.OPTION_RANGE_INTEGER,
            caption : caption,
            numberValue : value,
            minValue : minValue,
            maxValue : maxValue
        };
    }

    addRangeFloat(name : string, caption : string, value : number, minValue : number, maxValue : number, stepSize : number) {
        this.data[name] = {
            optionType : OptionType.OPTION_RANGE_FLOAT,
            caption : caption,
            numberValue : value,
            minValue : minValue,
            maxValue : maxValue,
            stepSize : stepSize
        };
    }

    addString(name : string, caption : string, value : string) {
        this.data[name] = {
            optionType : OptionType.OPTION_STRING,
            caption : caption,
            stringValue : value
        };
    }

    getData() {
        return this.data;
    }

    private data : ConfigurationData;
}

export const defaultConfiguration : Configuration = new Configuration();
defaultConfiguration.addBoolean('showLabels', 'Labels', false);
defaultConfiguration.addBoolean('showOrbits', 'Orbits', false);
defaultConfiguration.addBoolean('showInfo', 'Target Info', false);
defaultConfiguration.addBoolean('showSun', 'Sun', true);
defaultConfiguration.addBoolean('showMoon', 'Moon', false);
defaultConfiguration.addBoolean('showEclipses', 'Eclipses', false);
defaultConfiguration.addBoolean('showStars', 'Stars', false);
defaultConfiguration.addBoolean('showLinesLatitude', 'Latitude Lines', false);
defaultConfiguration.addBoolean('showLinesLongitude', 'Longitude Lines', false);

defaultConfiguration.addRangeFloat('orbitsForward', 'Num. Orbits Forward', 1.0, 0.0, 10.0, 0.1);
defaultConfiguration.addRangeFloat('orbitsBackward', 'Num. Orbits Backward', 1.0, 0.0, 10.0, 0.1);
defaultConfiguration.addString('dummyParameter', 'dummyCaption', 'value');

export interface OptionLayout {
    title : string;
    options : string[];
};

export const defaultLayout : OptionLayout[] = [
    {
        title : "Visibility",
        options : [
            "showLabels",
            "showOrbits",
            "showInfo",
            "showSun",
            "showMoon",
            "showEclipses",
            "showStars"
        ]
    },
    {
        title: "Orbits",
        options : [
            "orbitsBackward",
            "orbitsForward"
        ]
    },
    {
        title: "Grid",
        options : [
            "showLinesLatitude",
            "showLinesLongitude"
        ]
    },
];