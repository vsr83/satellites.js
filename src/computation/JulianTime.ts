/**
 * Interface for GregorianTime outputs.
 */
export interface GregorianTime 
{
    year : number;
    month : number; 
    mday : number; 
    hour : number;
    minute : number; 
    second : number;
}

/**
 * Class with static methods for conversions between Julian time, Gregorian
 * time and Javascript timestamps.
 */
export class JulianTime
{
    /**
     * Compute Julian date for given calendar date.
     * 
     * @param {number} year 
     *      Year as an integer.
     * @param {number} month 
     *      Month (1-12).
     * @param {number} mday 
     *      Day of the month (1-31).
     * @returns {number} Julian date.
     */
    static dateJulianYmd(year : number, month : number, mday : number) : number
    {
        if (month < 3)
        {
            year--;
            month += 12;
        }

        const A = Math.floor(year / 100.0);
        const B = Math.floor(A / 4.0);
        const C = Math.floor(2.0 - A + B);
        const E = Math.floor(365.25 * (year + 4716.0));
        const F = Math.floor(30.6001 * (month + 1.0));

        return C + mday + E + F - 1524.5;    
    }

    /**
     * Compute Julian time.
     * 
     * @param {number} year 
     *      Year as an integer.
     * @param {number} month 
     *      Month (1-12) integer.
     * @param {number} mday 
     *      Day of the month (1-31) integer.
     * @param {number} hour 
     *      Hour (0-23) integer.
     * @param {number} minute
     *      Minute (0-59) integer. 
     * @param {number} second 
     *      Second (0-60) floating point.
     * @returns {number} An object with JD and JT for Julian date and time.
     */
    static timeJulianYmdhms(year : number, month : number, mday : number, 
        hour : number, minute : number, second : number) : number
    {
        const JD = this.dateJulianYmd(year, month, mday);
        const JT = JD + hour / 24.0 + minute/(24.0 * 60.0) + second/(24.0 * 60.0 * 60.0);

        return JT;
    }

    /**
     * Compute Julian time from Javascript timestamp.
     * 
     * @param {Date} d 
     *      Date object.
     * @returns {number} Julian time. 
     */
    static timeJulianTs(d : Date) : number
    {
        let year = d.getUTCFullYear();
        let month = d.getUTCMonth() + 1;
        
        let mday = d.getUTCDate();
        let hour = d.getUTCHours();
        let minute = d.getUTCMinutes();
        let second = d.getUTCSeconds() + d.getUTCMilliseconds() / 1000.0;

        return this.timeJulianYmdhms(year, month, mday, hour, minute, second);
    }

    /**
     * Compute Julian date from Javascript timestamp.
     * 
     * @param {Date} d 
     *      Date object.
     * @returns {number} Julian date. 
     */
    static dateJulianTs(d : Date) : number
    {
        let year = d.getUTCFullYear();
        let month = d.getUTCMonth() + 1;
        
        let mday = d.getUTCDate();
        let hour = d.getUTCHours();
        let minute = d.getUTCMinutes();
        let second = d.getUTCSeconds() + d.getUTCMilliseconds() / 1000.0;

        return this.dateJulianYmd(year, month, mday);
    }

    /**
     * Compute Gregorian date and time from Julian time.
     * 
     * @param {number} JT 
     *      Julian time or date.
     * @returns {GregorianTime} Gregorian time object. 
     */
    static timeGregorian(JT : number) : GregorianTime
    {
        // Meeus - Astronomical Algorithms - Chapter 7.
        const Z = Math.floor(JT + 0.5);
        const F = JT + 0.5 - Z;
        let A = Z;
        if (Z >= 2299161) 
        {
            let alpha = Math.floor((Z - 1867216.25) / 36524.25);
            A = Z + 1 + alpha - Math.floor(alpha / 4.0);
        }
        const B = A + 1524;
        const C = Math.floor((B - 122.1) / 365.25);
        const D = Math.floor(365.25 * C);
        const E = Math.floor((B - D)/30.6001);

        const mday = Math.floor(B - D - Math.floor(30.6001 * E) + F);
        let month = E - 1;
        if (E >= 14)
        {
            month = E - 13;
        }
        let year = C - 4716;
        if (month < 3)
        {
            year = C - 4715;
        }

        let JTfrac = F;
        if (JTfrac < 0)
        {
            JTfrac += 1;
        }
        const hour = Math.floor(JTfrac * 24.0);
        JTfrac -= hour / 24.0;
        const minute = Math.floor(JTfrac * (24.0 * 60.0));
        JTfrac -= minute / (24.0 * 60.0);
        const second = JTfrac * (24.0 * 60.0 * 60.0);

        return {year : year, month : month, mday : mday, 
            hour : hour, minute : minute, second : second};
    }
}