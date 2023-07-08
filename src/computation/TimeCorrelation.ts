import corrData from '../../data/time_correlation_data.json';

/**
 * Enumeration for time conventions.
 */
export enum TimeConvention {
   TIME_TDB,
   TIME_UT1,
   TIME_UTC,
   TIME_TAI
};

/**
 * Interface for the output from time correlation activity.
 */
export interface TimeStamp {
    JTtdb : number;
    JTut1 : number;
    JTutc : number;
    JTtai : number;
    polarDx : number;
    polarDy : number;
};

/**
 * Interface for time correlation input data used in the interpolation.
 */
export interface TimeCorrelationData {
    data : number[][];
    minJD : number;
    maxJD : number;
}

// Internal hard-coded data.
const ut1TaiInternal : TimeCorrelationData = corrData.ut1Tai;
const ut1UtcInternal : TimeCorrelationData = corrData.ut1Utc;
const polarInternal : TimeCorrelationData  = corrData.polar;

/**
 * Perform binary search of data.
 * 
 * @param {TimeCorrelationData} data 
 *      JSON of data with fields minJD, maxJD and data.
 * @param {number} JT 
 *      Julian time.
 * @param {boolean} doInterp
 *      Whether to perform interpolation of the values. 
 * @returns {number[]} The possibly interpolated data.
 */
function interpolateSearch(data : TimeCorrelationData, JT : number , doInterp : boolean)
{
    if (JT <= data.minJD)
    {
        return data.data[0];
    }
    if (JT >= data.maxJD)
    {
        return data.data[data.data.length - 1];
    }

    let pointerStart = 0;
    let pointerEnd = data.data.length - 1;
    let done = false;

    while (!done)
    {
        let firstHalfStart = pointerStart;
        let secondHalfStart = Math.floor(0.5 * (pointerStart + pointerEnd));
        let JTstart = data.data[firstHalfStart][0];
        let JTmiddle = data.data[secondHalfStart][0];
        let JTend = data.data[pointerEnd][0];

        if (JT >= JTstart && JT <= JTmiddle)
        {
            pointerEnd = secondHalfStart;
        }
        else 
        {
            pointerStart = secondHalfStart;
        }

        if (pointerEnd - pointerStart <= 1)
        {
            done = true;
        }

        //console.log(pointerStart + " " + pointerEnd + " " + done + " " + data.data.length);
    }

    if (pointerStart == pointerEnd)
    {
        return data.data[pointerStart];
    }
    else 
    {
        const dataFirst = data.data[pointerStart];
        const dataSecond = data.data[pointerEnd];

        if (doInterp)
        {
            let dataOut = [JT];
            for (let indData = 1; indData < dataFirst.length; indData++)
            {
                const value = dataFirst[indData];
                const valueNext = dataSecond[indData];
                const JTcurrent = dataFirst[0];
                const JTnext = dataSecond[0];

                dataOut.push(value + (valueNext - value) * (JT - JTcurrent) / (JTnext - JTcurrent));
            }

            return dataOut;
        }
        else 
        {
            // We wish to avoid situation, where a leap second is introduced and
            // the new value introduces a jump to the second for a julian time before
            // end of the year.
            return dataFirst;
        }
    }
}

function deepCopy(array : any)
{
    return JSON.parse(JSON.stringify(array));
}

/**
 * Class for performing time correlation computations.
 */
export class TimeCorrelation 
{
    dataUt1Tai : TimeCorrelationData;
    dataUt1Utc : TimeCorrelationData;
    dataPolar  : TimeCorrelationData;

    /**
     * Public constructor.
     */
    constructor() 
    {
        // We want to allow the user to modify the data used for time
        // correlation without influencing the inputs for the constructor.
        this.dataUt1Tai = deepCopy(ut1TaiInternal);
        this.dataUt1Utc = deepCopy(ut1UtcInternal);
        this.dataPolar  = deepCopy(polarInternal);
    }

    /**
     * Get correlation data for UT1 - TAI conversion.
     * 
     * @returns {TimeCorrelationData} Correlation data.
     */
    getDataUt1Tai() : TimeCorrelationData
    {
        return this.dataUt1Tai;
    }

    /**
     * Get correlation data for UT1 - UTC conversion.
     * 
     * @returns {TimeCorrelationData} Correlation data.
     */
    getDataUt1Utc() : TimeCorrelationData
    {
        return this.dataUt1Utc;
    }

    /**
     * Get polar motion data.
     * 
     * @returns {TimeCorrelationData} Polar motion data.
     */
    getDataPolar() : TimeCorrelationData
    {
        return this.dataPolar;
    }

    /**
     * Convert UT1 to TAI time.
     * 
     * @param {number} JTut1 
     *      Julian time.
     * @returns {number} TAI Julian time.
     */
    correlationUt1Tai(JTut1 : number) : number
    {
        return JTut1 - interpolateSearch(this.dataUt1Tai, JTut1, true)[1] / 86400.0;
    }

    /**
     * Convert TAI to UT1 time.
     * 
     * @param {number} JTtai
     *      Julian time.
     * @returns {number} UT1 Julian time.
     */
    correlationTaiUt1(JTtai : number) : number
    {
        return JTtai + interpolateSearch(this.dataUt1Tai, JTtai, true)[1] / 86400.0;
    }

    /**
     * Convert TDB to TAI time.
     * 
     * @param {number} JTtdb
     *      TDB Julian time.
     * @returns {number} TAI Julian time.
     */
    correlationTdbTai(JTtdb : number) : number
    {
        return JTtdb - 32.184 / 86400.0;
    }

    /**
     * Convert TAI to TDB time.
     * 
     * @param {number} JTtai
     *      TAI Julian time.
     * @returns {number} TDB Julian time.
     */
    correlationTaiTdb(JTtai : number) : number
    {
        return JTtai + 32.184 / 86400.0;
    }

    /**
     * Convert TDB to UT1 time.
     * 
     * @param {number} JTtdb
     *      TDB Julian time.
     * @returns {number} UT1 Julian time.
     */
    correlationTdbUt1(JTtdb : number) : number
    {
        const JTtai = JTtdb - 32.184 / 86400.0;
        return this.correlationTaiUt1(JTtai);
    }

    /**
     * Convert UT1 to TDB time.
     * 
     * @param {number} JTut1
     *      UT1 Julian time.
     * @returns {number} TDB Julian time.
     */
    correlationUt1Tdb(JTut1 : number) : number
    {
        const JTtai = this.correlationUt1Tai(JTut1);
        return JTtai + 32.184 / 86400.0;
    }

    /**
     * Convert UT1 to UTC time.
     * 
     * @param {number} JT 
     *      UT1 Julian time.
     * @returns {number} UTC Julian time.
     */
    correlationUt1Utc(JTut1 : number) : number
    {
        return JTut1 - interpolateSearch(this.dataUt1Utc, JTut1, false)[1] / 86400.0
    }

    /**
     * Convert UTC to UT1 time.
     * 
     * @param {number} JT 
     *      UTC Julian time.
     * @returns {number} UT1 Julian time.
     */
    correlationUtcUt1(JTutc : number) : number
    {
        // There is some difficulty with the first/last second of the year in case of 
        // leap seconds.
        let JTut1 = JTutc + interpolateSearch(this.dataUt1Utc, JTutc, false)[1] / 86400.0;

        const JTsecond = 1.0/86400.0;

        // We wish for UTC(UT1(UTC)) = UTC.
        if (Math.abs(JTutc - this.correlationUt1Utc(JTut1)) > 0.001 * JTsecond)
        {
            if (JTutc - Math.floor(JTutc) > 0)
            {
                JTut1 = JTutc + interpolateSearch(this.dataUt1Utc, JTutc + JTsecond, false)[1] / 86400.0;
            }
            else 
            {
                JTut1 = JTutc + interpolateSearch(this.dataUt1Utc, JTutc - JTsecond, false)[1] / 86400.0;
            }
        }

        return JTut1;
    }

    /**
     * Compute polar motion.
     * 
     * @param {number} JT 
     *      UT1 Julian time.
     * @returns {number[]} [dx, dy] array in degrees.
     */
    polarMotion(JTut1 : number) : number[]
    {
        const data = interpolateSearch(this.dataPolar, JTut1, true);
        return [data[1] / 3600.0, data[2] / 3600.0];
    }

    /**
     * Compute time stamp containing Julian time in all conventions and polar motion.
     * 
     * @param {number} JT 
     *      Julian time in given time convention.
     * @param {TimeConvention} convention 
     *      The used time convention.
     * @param {boolean} computePolar 
     *      Whether polar motion is computed.
     * @returns Time stamp.
     */
    computeTimeStamp(JT : number, convention : TimeConvention, computePolar : boolean) : TimeStamp
    {
        let JTtdb;
        let JTtai;
        let JTut1;
        let JTutc;
        let polarDx;
        let polarDy;

        if (convention == TimeConvention.TIME_TDB)
        {
            JTtdb = JT;
            JTut1 = this.correlationTdbUt1(JTtdb);
            JTutc = this.correlationUt1Utc(JTut1);
            JTtai = this.correlationTdbTai(JTtdb);
        }
        if (convention == TimeConvention.TIME_TAI)
        {
            JTtai = JT;
            JTtdb = this.correlationTaiTdb(JTtai);
            JTut1 = this.correlationTaiUt1(JTtai);
            JTutc = this.correlationUt1Utc(JTut1);
        }
        if (convention == TimeConvention.TIME_UTC)
        {
            JTutc = JT;
            JTut1 = this.correlationUtcUt1(JTutc);
            JTtai = this.correlationUt1Tai(JTut1);
            JTtdb = this.correlationTaiTdb(JTtai);
        }
        if (convention == TimeConvention.TIME_UT1)
        {
            JTut1 = JT;
            JTutc = this.correlationUt1Utc(JTut1);
            JTtai = this.correlationUt1Tai(JTut1);
            JTtdb = this.correlationTaiTdb(JTtai);
        }

        if (computePolar)
        {
            [polarDx, polarDy] = this.polarMotion(JTut1);
        }
        else 
        {
            polarDx = polarDy = 0;
        }

        return {
            JTut1 : JTut1,
            JTutc : JTutc,
            JTtai : JTtai,
            JTtdb : JTtdb,
            polarDx : polarDx,
            polarDy : polarDy
        };
    }

    /**
     * Add small delta time to a timestamp.
     * 
     * @param {TimeStamp} timeStampIn 
     *      Input timestamp.
     * @param {number} deltaJT 
     *      Delta julian days. The time should be small enough not to influence
     *      the differences between values for different time conventions.
     * @returns {TimeStamp} Updated time stamp.
     */
    static addDelta(timeStampIn : TimeStamp, deltaJT : number) : TimeStamp
    {
        return {
            JTut1 : timeStampIn.JTut1 + deltaJT,
            JTutc : timeStampIn.JTutc + deltaJT,
            JTtai : timeStampIn.JTtai + deltaJT,
            JTtdb : timeStampIn.JTtdb + deltaJT,
            polarDx : timeStampIn.polarDx,
            polarDy : timeStampIn.polarDy
        };
    }
}