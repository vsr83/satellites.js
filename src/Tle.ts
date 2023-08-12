import {GregorianTime, JulianTime} from "./computation/JulianTime";
import { TargetInfo } from "./viewTargets/Target";

enum TleFieldType {
    FIELD_NUMBER,
    FIELD_NUMBER_IMPLIED,
    FIELD_NUMBER_MAPPED,
    FIELD_STRING
};

interface TleField {
    name : string;
    fieldType : TleFieldType;
    row : number;
    startCol : number;
    endCol : number;
    callback? : Function;
};

const tleFormat : TleField[] = [
    {name : "title",         fieldType : TleFieldType.FIELD_STRING, row : 0, startCol :  0, endCol : 23},
    {name : "catalogNumber", fieldType : TleFieldType.FIELD_NUMBER, row : 1, startCol :  2, endCol :  6},
    {name : "classification",fieldType : TleFieldType.FIELD_STRING, row : 1, startCol :  7, endCol :  7},
    {name : "intLaunchYear", fieldType : TleFieldType.FIELD_STRING, row : 1, startCol :  9, endCol : 10},
    {name : "intLaunchNum",  fieldType : TleFieldType.FIELD_STRING, row : 1, startCol : 11, endCol : 13},
    {name : "intLaunchPiece",fieldType : TleFieldType.FIELD_STRING, row : 1, startCol : 14, endCol : 16},
    {name : "epochYear",     fieldType : TleFieldType.FIELD_NUMBER_MAPPED, row : 1, startCol :18, endCol :19,
     callback : function(suffix : number) 
     {
        if (suffix > 56) { 
            return 1900 + suffix;
        }
        else 
        {
            return 2000 + suffix;
        }
    }},
    {name : "epochFracDay",     fieldType : TleFieldType.FIELD_NUMBER, row : 1, startCol : 20, endCol : 31},
    {name : "meanMotionDer",    fieldType : TleFieldType.FIELD_NUMBER, row : 1, startCol : 33, endCol : 42},
    {name : "meanMotionDer2",   fieldType : TleFieldType.FIELD_NUMBER_IMPLIED, row : 1, startCol : 44, endCol : 51},
    {name : "dragTerm",         fieldType : TleFieldType.FIELD_NUMBER_IMPLIED, row : 1, startCol : 53, endCol : 60},
    {name : "ephemerisType",    fieldType : TleFieldType.FIELD_NUMBER, row : 1, startCol : 62, endCol : 62},
    {name : "elementSetNo",     fieldType : TleFieldType.FIELD_NUMBER, row : 1, startCol : 64, endCol : 67},
    {name : "checkSum1",        fieldType : TleFieldType.FIELD_NUMBER, row : 1, startCol : 68, endCol : 68},
    {name : "catalogNumber2",   fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol :  2, endCol :  6},
    {name : "inclination",      fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol :  8, endCol : 15},
    {name : "raAscNode",        fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol : 17, endCol : 24},
    {name : "eccentricity",     fieldType : TleFieldType.FIELD_NUMBER_IMPLIED, row : 2, startCol : 26, endCol : 32},
    {name : "argPerigee",       fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol : 34, endCol : 41},
    {name : "meanAnomaly",      fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol : 43, endCol : 50},
    {name : "meanMotion",       fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol : 52, endCol : 62},
    {name : "revNoAtEpoch",     fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol : 63, endCol : 67},
    {name : "checkSum2",        fieldType : TleFieldType.FIELD_NUMBER, row : 2, startCol : 68, endCol : 68}
]

interface ITle
{
    OBJECT_NAME         : string;
    OBJECT_ID           : string;
    EPOCH               : string;
    MEAN_MOTION         : number;
    ECCENTRICITY        : number;
    INCLINATION         : number;
    RA_OF_ASC_NODE      : number;
    ARG_OF_PERICENTER   : number;
    MEAN_ANOMALY        : number;
    EPHEMERIS_TYPE      : number;
    CLASSIFICATION_TYPE : string;
    NORAD_CAT_ID        : number;
    ELEMENT_SET_NO      : number;
    REV_AT_EPOCH        : number;
    BSTAR               : number;
    MEAN_MOTION_DOT     : number;
    MEAN_MOTION_DDOT    : number;
}

/**
 * Class for TLE representation.
 */
export class Tle
{
    // Satellite name (string)
    title : string;
    // Satellite catalog number (number)
    catalogNumber : number;
    // Classification (character 'U' or 'C')
    classification : string;
    // International Designator (last two digits of launch year) (string)
    intLaunchYear : string;
    // International Designator (launch number of the year) (string)
    intLaunchNum : string;
    // International Designator (piece of the launch) (string)
    intLaunchPiece : string;
    // Epoch Year (last two digits, for values above 56, 19 prefix is assumed) (number)
    epochYear : number;
    // Epoch fractional day (number)
    epochFracDay : number;
    // First derivative of mean motion; the ballistic coefficient (number)
    meanMotionDer : number;
    // Second derivative of mean motion (decimal point assumed, number)
    meanMotionDer2 : number;
    // B*, the drag term, or radiation pressure coefficient (decimal point assumed, number)
    dragTerm : number;
    // Ephemeris type (number)
    ephemerisType : number;
    // Element set number (number)
    elementSetNo : number;
    // Checksum for line 1 (modulo 10, number)
    checkSum1 : number;
    // Satellite catalog number (string, repeated)
    catalogNumber2 : number;
    // Inclination (degrees)
    inclination : number;
    // Right ascension of the ascending node (degrees)
    raAscNode : number;
    // Eccentricity
    eccentricity : number;
    // Argument of perigee (degrees)
    argPerigee : number;
    // Mean anomaly (degrees)
    meanAnomaly : number;
    // Mean motion (revolutions per day)
    meanMotion : number;
    // Revolution number at epoch (revolutions)
    revNoAtEpoch : number;
    // Checksum for line 2 (modulo 10, number)
    checkSum2 : number;
    
    // Valid checksum.
    checkSumValid : boolean;
    // Julian time for the Epoch (UT1 TBC).
    jtUt1Epoch : number;

    constructor()
    {

    }

    /**
     * Fill from a JSON.
     * 
     * @param {TargetInfo} json 
     *      The JSON.
     */
    static fromJson(json : TargetInfo) : Tle
    {
        const tle : Tle = new Tle();

        function parseEpoch(str : string) : number
        {
            const year       = parseInt(str.substring(0, 4));
            const month      = parseInt(str.substring(5, 7));
            const dayOfMonth = parseInt(str.substring(8, 10));
            const hour       = parseInt(str.substring(11, 13));
            const minute     = parseInt(str.substring(14, 16));
            const second     = parseFloat(str.substring(17));

            return JulianTime.timeJulianYmdhms(year, month, dayOfMonth, hour, minute, second);            
        }

        /*{
            "OBJECT_NAME":"IRNSS-1J",
            "OBJECT_ID":"2023-076A",
            "EPOCH":"2023-05-30T14:16:31.144224",
            "MEAN_MOTION":1.62870852,
            "ECCENTRICITY":0.5200823,
            "INCLINATION":10.1782,
            "RA_OF_ASC_NODE":270.0597,
            "ARG_OF_PERICENTER":178.1733,
            "MEAN_ANOMALY":185.3385,
            "EPHEMERIS_TYPE":0,
            "CLASSIFICATION_TYPE":"U",
            "NORAD_CAT_ID":56759,
            "ELEMENT_SET_NO":999,
            "REV_AT_EPOCH":2,
            "BSTAR":0,
            "MEAN_MOTION_DOT":-1.04e-6,
            "MEAN_MOTION_DDOT":0}
        */

        tle.epochYear = parseInt((<string> json["EPOCH"]).substring(0, 4));
        const jtEpochYear = JulianTime.timeJulianYmdhms(tle.epochYear, 1, 1, 0, 0, 0);
        tle.jtUt1Epoch = parseEpoch(<string> json["EPOCH"]);
        tle.epochFracDay = tle.jtUt1Epoch - jtEpochYear;
    
        tle.title          = <string> json["OBJECT_NAME"];
        tle.catalogNumber  = <number> json["NORAD_CAT_ID"];
        tle.classification = <string> json["CLASSIFICATION_TYPE"];
        tle.intLaunchYear  = (<string>json["OBJECT_ID"]).substring(2, 4);
        tle.intLaunchNum   = (<string>json["OBJECT_ID"]).substring(5, 8);
        tle.intLaunchPiece = (<string>json["OBJECT_ID"]).substring(8, 11);
        tle.meanMotionDer  = <number> json["MEAN_MOTION_DOT"];
        tle.meanMotionDer2 = <number> json["MEAN_MOTION_DDOT"];
        tle.dragTerm       = <number> json["BSTAR"];
        tle.ephemerisType  = <number> json["EPHEMERIS_TYPE"];
        tle.elementSetNo   = <number> json["ELEMENT_SET_NO"];
        tle.catalogNumber2 = <number> json["NORAD_CAT_ID"];
        tle.inclination    = <number> json["INCLINATION"];
        tle.raAscNode      = <number> json["RA_OF_ASC_NODE"];
        tle.eccentricity   = <number> json["ECCENTRICITY"];
        tle.argPerigee     = <number> json["ARG_OF_PERICENTER"];
        tle.meanAnomaly    = <number> json["MEAN_ANOMALY"];
        tle.meanMotion     = <number> json["MEAN_MOTION"];
        tle.revNoAtEpoch   = <number> json["REV_AT_EPOCH"];

        const lines = tle.toLines();
        tle.checkSum1 = parseInt(lines[1].substring(68, 69));
        tle.checkSum2 = parseInt(lines[2].substring(68, 69));
        tle.checkSumValid = true;

        return tle;
    }

    /**
     * Create from lines.
     * 
     * @param {string[]} lines
     *      The three lines of the TLE as strings.
     * @returns {Tle} The object constructed from the lines.
     */
    static fromLines(lines : string[]) : Tle
    {
        const tle : Tle = new Tle();

        /**
         * Fill from a JSON.
         * 
         * @param {ITle} json 
         *      The JSON.
         */
        function fillFromJson(json : any)
        {
            tle.title = json.title;
            tle.catalogNumber = json.catalogNumber;
            tle.classification = json.classification;
            tle.intLaunchYear = json.intLaunchYear;
            tle.intLaunchNum = json.intLaunchNum;
            tle.intLaunchPiece = json.intLaunchPiece;
            tle.epochYear = json.epochYear;
            tle.epochFracDay = json.epochFracDay;
            tle.meanMotionDer = json.meanMotionDer;
            tle.meanMotionDer2 = json.meanMotionDer2;
            tle.dragTerm = json.dragTerm;
            tle.ephemerisType = json.ephemerisType;
            tle.elementSetNo = json.elementSetNo;
            tle.checkSum1 = json.checkSum1;
            tle.catalogNumber2 = json.catalogNumber2;
            tle.inclination = json.inclination;
            tle.raAscNode = json.raAscNode;
            tle.eccentricity = json.eccentricity;
            tle.argPerigee = json.argPerigee;
            tle.meanAnomaly = json.meanAnomaly;
            tle.meanMotion = json.meanMotion;
            tle.revNoAtEpoch = json.revNoAtEpoch;
            tle.checkSum2 = json.checkSum2;
        }

        const json : any = {};

        for (let indField = 0; indField < tleFormat.length; indField++)
        {
            const field : TleField = tleFormat[indField];
            const str = lines[field.row].substring(field.startCol, field.endCol + 1);

            switch(field.fieldType)
            {
            case TleFieldType.FIELD_STRING:
                json[field.name] = str;
                break;
            case TleFieldType.FIELD_NUMBER:
                json[field.name] = Number(str);
                break;
            case TleFieldType.FIELD_NUMBER_IMPLIED:
                if (str[0] == '-')
                {
                    json[field.name] = -Number("0." + str.substring(1).replace("-", "e-").replace("+", "e").replace(" ", ""));
                }
                else 
                {
                    json[field.name] = Number("0." + str.replace("-", "e-").replace("+", "e").replace(" ", ""));
                }
                break;
            case TleFieldType.FIELD_NUMBER_MAPPED:
                if (field.callback)
                {
                    json[field.name] = field.callback(Number(str));
                }
                break;
            }
        }
        fillFromJson(json);

        tle.checkSumValid = (Tle.lineChecksum(lines[1]) == tle.checkSum1) &&
                            (Tle.lineChecksum(lines[2]) == tle.checkSum2);

        tle.jtUt1Epoch = this.parseEpoch(tle.epochYear, tle.epochFracDay);

        return tle;
    }

    toJson() : TargetInfo
    {
        /*{
        "OBJECT_NAME":"IRNSS-1J",
        "OBJECT_ID":"2023-076A",
        "EPOCH":"2023-05-30T14:16:31.144224",
        "MEAN_MOTION":1.62870852,
        "ECCENTRICITY":0.5200823,
        "INCLINATION":10.1782,
        "RA_OF_ASC_NODE":270.0597,
        "ARG_OF_PERICENTER":178.1733,
        "MEAN_ANOMALY":185.3385,
        "EPHEMERIS_TYPE":0,
        "CLASSIFICATION_TYPE":"U",
        "NORAD_CAT_ID":56759,
        "ELEMENT_SET_NO":999,
        "REV_AT_EPOCH":2,
        "BSTAR":0,
        "MEAN_MOTION_DOT":-1.04e-6,
        "MEAN_MOTION_DDOT":0}
        */

        let launchYear : string;
        if (parseInt(this.intLaunchYear) > 56)
        {
            launchYear = "19" + this.intLaunchYear;
        }
        else
        {
            launchYear = "20" + this.intLaunchYear;
        }

        function toFixed(num : number)
        {
            if (num < 10)
            {
                return "0" + num.toString();
            }
            else 
            {
                return num.toString();
            }
        }
        //"EPOCH":"2023-05-30T14:16:31.144224",
        const epochGregorian : GregorianTime = JulianTime.timeGregorian(this.jtUt1Epoch);
        const epochTimestamp : string = epochGregorian.year 
                             + "-" + toFixed(epochGregorian.month)
                             + "-" + toFixed(epochGregorian.mday)
                             + "T" + toFixed(epochGregorian.hour)
                             + ":" + toFixed(epochGregorian.minute)
                             + ":" + toFixed(Math.floor(epochGregorian.second))
                             + "." + (epochGregorian.second % 1.0).toFixed(6).substring(2);

        const json : TargetInfo = {
            "TYPE"                : "TLE",
            "OBJECT_NAME"         : this.title,
            "OBJECT_ID"           : launchYear + "-" + this.intLaunchNum + this.intLaunchPiece,
            "EPOCH"               : epochTimestamp,
            "MEAN_MOTION"         : this.meanMotion,
            "ECCENTRICITY"        : this.eccentricity,
            "INCLINATION"         : this.inclination,
            "RA_OF_ASC_NODE"      : this.raAscNode,
            "ARG_OF_PERICENTER"   : this.argPerigee,
            "MEAN_ANOMALY"        : this.meanAnomaly,
            "EPHEMERIS_TYPE"      : this.ephemerisType,
            "CLASSIFICATION_TYPE" : this.classification,
            "NORAD_CAT_ID"        : this.catalogNumber,
            "ELEMENT_SET_NO"      : this.elementSetNo,
            "REV_AT_EPOCH"        : this.revNoAtEpoch,
            "BSTAR"               : this.dragTerm,
            "MEAN_MOTION_DOT"     : this.meanMotionDer,
            "MEAN_MOTION_DDOT"    : this.meanMotionDer2
        };

        return json;
    }

    /**
     * Generate string array-representation of the TLE.
     * 
     * @returns {string[]} The three strings.
     */
    toLines() : string[]
    {
        /**
         * Create fixed-width string representation of an integer with a prefix made from
         * given characters.
         * 
         * @param {number} value 
         *      The value.
         * @param {number} width 
         *      The width of the string.
         * @param {string} filler 
         *      The character used for padding.
         * @returns 
         */
        function addIntPrefix(value : number, width : number, filler : string) : string
        {
            let prefix = "";

            for (let ind = 0; ind < width - 1; ind++)
            {
                let valueExp = Math.pow(10, width - 1 - ind);
                if (value < valueExp)
                {
                    prefix = prefix + filler;
                }
            }
            return prefix + value.toString();
        }

        /**
         * Create fixed-width string representation of the integer part of a number.
         * 
         * @param {number} deg 
         *      The number.
         * @returns {string} The string representation.
         */
        function degreeWhole(deg : number) : string
        {
            let degF = Math.floor(deg);

            if (degF < 10)
            {
                return "  " + degF.toString();
            }
            else if (degF < 100)
            {
                return " " + degF.toString();
            }
            else 
            {
                return degF.toString();
            }
        }

        /**
         * Create fixed-width string representation of the fractional part of a number.
         * 
         * @param {number} deg 
         *      The number.
         * @param {number} decimals 
         *      Number of decimals.
         * @returns {string} The string representation.
         */
        function degreeFrac(deg : number, decimals : number) : string
        {
            if (deg < 0)
            {
                deg = -deg;
            }

            return (deg - Math.floor(deg)).toFixed(decimals).toString().substring(1);
        }

        /**
         * Express a number in the exponential notation used by TLEs.
         * 
         * @param {number} value 
         *      The number.
         * @returns {string} The string.
         */
        function expNotation(value : number) : string
        {
            const sign : number = Math.sign(value);
            value = value * sign;
            const signStr = (sign > 0) ? " " : "-";

            const logPart : number = Math.floor(Math.log10(value)) + 1;
            const fracPart : string = degreeFrac(value / Math.pow(10.0, logPart), 5).substring(1);

            if (value == 0)
            {
                return " 00000+0";
            }
            else if (value < 0.1)
            {
                return signStr + fracPart + logPart;
            }
            else 
            {
                return signStr + fracPart + "+" + logPart;
            }
        }

        const line0 = this.title;
        const line1NoChecksum = "1" + " " 
                    + addIntPrefix(this.catalogNumber, 5, "0") + this.classification + " " 
                    + this.intLaunchYear + this.intLaunchNum + this.intLaunchPiece + " " 
                    + (this.epochYear % 100).toString() + degreeWhole(this.epochFracDay) + degreeFrac(this.epochFracDay, 8) + " "
                    + ((this.meanMotionDer < 0) ? "-" : " ") + degreeFrac(this.meanMotionDer, 8) + " "
                    + expNotation(this.meanMotionDer2) + " " 
                    + expNotation(this.dragTerm) + " " 
                    + this.ephemerisType + " " 
                    + addIntPrefix(this.elementSetNo, 4, " ");
        const line2NoChecksum = "2" + " "
                    + addIntPrefix(this.catalogNumber2, 5, "0") + " " 
                    + degreeWhole(this.inclination) + degreeFrac(this.inclination, 4) + " "
                    + degreeWhole(this.raAscNode) + degreeFrac(this.raAscNode, 4) + " "
                    + degreeFrac(this.eccentricity, 7).substring(1) + " "
                    + degreeWhole(this.argPerigee) + degreeFrac(this.argPerigee, 4) + " "
                    + degreeWhole(this.meanAnomaly) + degreeFrac(this.meanAnomaly, 4) + " "
                    + addIntPrefix(Math.floor(this.meanMotion), 2, " ") + degreeFrac(this.meanMotion, 8)
                    + addIntPrefix(this.revNoAtEpoch, 5, " ");
        const line1 = line1NoChecksum + Tle.lineChecksum(line1NoChecksum);
        const line2 = line2NoChecksum + Tle.lineChecksum(line2NoChecksum);

        return [line0, line1, line2];
    }

    /**
     * Compute checksum for TLE line.
     * 
     * @param {string} line 
     *      TLE line
     * @returns {number} Modulo-10 checksum.
     */
    static lineChecksum(lineIn : string) : number
    {
        let checksum = 0; 
        const line = lineIn.substring(0, 68);

        for (let ind = 0; ind < line.length; ind++)
        {
            const char = line[ind];
    
            if ('0123456789'.indexOf(char) > -1)
            {
                checksum += parseInt(char);
            }
            else if (char == '-')
            {
                checksum++;
            }
        }
        return checksum % 10;
    }

    /**
     * Compute Julian time of the epoch.
     * 
     * @param {number} year 
     *      The year (all four digits).
     * @param {number} days 
     *      Fractional days of the year.
     * @returns {number} The Julian time of the epoch.
     */
    static parseEpoch(year : number, days : number) : number
    {
        const isLeap : boolean = (year % 4) == 0;
        const monthLengths : number[] = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const dayOfYear : number = Math.floor(days);

        let month = 0;
        let sumDays = 0;
        for (month = 0; month < 12; month++)
        {
            const monthLength : number = monthLengths[month];

            if (dayOfYear - sumDays - monthLength < 0)
            {
                break;
            }
            sumDays += monthLength;
        }
        const dayOfMonth : number = dayOfYear - sumDays;
        const fracDay : number = days - dayOfYear;
        const hour : number = Math.floor(fracDay * 24.0);
        const minute : number = Math.floor((fracDay - hour / 24.0) * 1440.0);
        const second : number = (fracDay - hour / 24.0 - minute / 1440.0) * 86400.0;

        return JulianTime.timeJulianYmdhms(year, month + 1, dayOfMonth, hour, minute, second);
    }
}