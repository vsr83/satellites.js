
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
    OPTION_STRING,
    OPTION_SELECT
};

export interface IOption {
    optionType : OptionType;
    caption : string;
    booleanValue? : boolean;
    numberValue? : number;
    arrayValue? : number[];
    optionList? : string[];
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

    addOption(name : string, caption : string, options : string[], value : string) {
        this.data[name] = {
            optionType : OptionType.OPTION_SELECT,
            caption : caption,
            optionList : options
        };
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

    getBoolean(name : string) : boolean {
        return <boolean> this.data[name].booleanValue;
    }

    getNumber(name : string) : number {
        return <number> this.data[name].numberValue;
    }

    getString(name : string) : string {
        return <string> this.data[name].stringValue;
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
defaultConfiguration.addBoolean('showEquator', 'Show Equator', true);
defaultConfiguration.addBoolean('showPrimeMeridian', 'Show Prime Meridian', true);

defaultConfiguration.addRangeFloat('orbitsForward', 'Num. Orbits Forward', 1.0, 0.0, 10.0, 0.1);
defaultConfiguration.addRangeFloat('orbitsBackward', 'Num. Orbits Backward', 1.0, 0.0, 10.0, 0.1);
defaultConfiguration.addString('dummyParameter', 'dummyCaption', 'value');

defaultConfiguration.addRangeFloat('gridLongitudeStep', 'Grid Longitude Step', 15.0, 1.0, 90.0, 1.0);
defaultConfiguration.addRangeFloat('gridLatitudeStep', 'Grid Latitude Step', 15.0, 1.0, 45.0, 1.0);

defaultConfiguration.addOption('projection2d', 'Projection', 
    ['Rectangular', 'Azi-Equidistant'], 'Rectangular');

defaultConfiguration.addOption('showAllOrbits', 'Show Orbits', 
    ['Selected', 'All'], 'Selected');


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
        title: "2D View",
        options : [
            "projection2d"
        ]
    },
    {
        title: "Orbits",
        options : [
            "showAllOrbits",
            "orbitsBackward",
            "orbitsForward"
        ]
    },
    {
        title: "Grid",
        options : [
            "showEquator",
            "showPrimeMeridian",
            "showLinesLatitude",
            "showLinesLongitude",
            "gridLongitudeStep",
            "gridLatitudeStep"
        ]
    },
];