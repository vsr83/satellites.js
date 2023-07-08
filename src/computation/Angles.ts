/**
 * Interface for degree-arcmin-arcsec outputs.
 */
export interface AnglesArc 
{
    deg : number;
    arcMin : number;
    arcSec : number;
};

/**
 * Interface for hour-minute-second outputs.
 */
export interface AnglesHms
{
    hour : number;
    minute : number;
    second : number;
};

export class Angles 
{
    /**
     * Limit angle to [0, 360.0) interval.
     * 
     * @param {number} deg 
     *      The angle in degrees.
     * @returns {number} Angle limited to the interval [0, 360).
     */
    static limitAngleDeg(deg : number) : number
    {
        return deg - 360.0 * Math.floor(deg / 360.0);
    }

    /**
     * Limit angle to [-180, 180.0) interval.
     * 
     * @param {number} deg 
     *      The angle in degrees.
     * @returns {number} Angle limited to the interval [-180, 180).
     */
    static limitAngleDeg180(deg : number) : number
    {
        deg = this.limitAngleDeg(deg);

        if (deg > 180)
        {
            return deg - 360;
        }
        else
        {
            return deg;
        }
    }
    

    /**
     * Compute (signed) difference in angle between the angles.
     * 
     * @param {number} deg1 
     *      The first angle in degrees.
     * @param {number} deg2 
     *      The second angle in degrees.
     * @returns {number} Shortest rotation deg1 -> deg2.
     */
    static angleDiff(deg1 : number, deg2 : number) : number
    {
        // Handle missing arguments to avoid recursion.
        if (deg1 === undefined)
        {
            deg1 = 0;
        }
        if (deg2 === undefined)
        {
            deg2 = 0;
        }

        const deg1Lim = this.limitAngleDeg(deg1);
        const deg2Lim = this.limitAngleDeg(deg2);

        if (deg1Lim <= deg2Lim)
        {
            const diff = deg2Lim - deg1Lim;
            
            if (diff <= 180.0)
            {
                return diff;
            }
            else 
            {
                // 30 350 -> 350 - 390 = -40
                return deg2Lim - (deg1Lim + 360.0); 
            }
        }
        else 
        {
            return -this.angleDiff(deg2, deg1);
        }
    }

    /**
     * Convert angle in degree-arcmin-arcsec format to degrees.
     * 
     * @param {number} deg
     *      Degrees.
     * @param {number} arcMin
     *      Arcminutes
     * @param {number} arcSec
     *      Arcseconds.
     * @returns {number} The angle in degrees.
     */
    static angleArcDeg(deg : number, arcMin : number, arcSec : number) : number
    {
        let sign = 1;

        if (deg == 0 && arcMin == 0)
        {
            return this.limitAngleDeg(arcSec / 3600.0);
        }
        else if (deg == 0)
        {
            sign = Math.sign(arcMin);
        }
        else 
        {
            sign = Math.sign(deg);
        }

        return this.limitAngleDeg(deg + sign*arcMin/60.0 + sign*arcSec/3600.0);
    }

    /**
     * Convert angle in degrees to degree-arcmin-arcsec format.
     * 
     * @param {number} degIn 
     *      The angle in degrees.
     * @param {boolean} limit360
     *      Limit to range [0, 360).
     * @returns {AnglesArc} An object with deg, arcMin and arcSec fields.
     */
    static angleDegArc(degIn : number, limit360 : boolean) : AnglesArc
    {
        let angle = 0;
        if (limit360 === undefined)
        {
            limit360 = false;
        }
        if (limit360)
        {
            angle = this.limitAngleDeg(degIn);
        }
        else 
        {
            angle = this.limitAngleDeg180(degIn);
        }

        const angleSign = Math.sign(angle);
        const angleSize = Math.abs(angle);

        let degOut = Math.floor(angleSize);
        let arcMin = Math.floor((angleSize - degOut) * 60.0);
        let arcSec = (angleSize - degOut - arcMin / 60.0) * 3600.0;

        let signDeg = 1;
        let signMin = 1;
        let signSec = 1;

        if (degOut == 0 && arcMin == 0)
        {
            signSec = angleSign;
        }
        else if (degOut == 0)
        {
            signMin = angleSign;
        }
        else 
        {
            signDeg = angleSign;
        }

        return {deg : signDeg * degOut, arcMin : signMin * arcMin, arcSec : signSec * arcSec};
    }

    /**
     * Convert angle in degrees to hour-min-sec format.
     * 
     * @param {number} deg
     *      The angle in degrees.
     * @returns {AnglesHms} An object with hour, minute, second fields.
     */
    static angleDegHms(deg : number) : AnglesHms 
    {
        const hourSize = 360.0 / 24.0;
        const minuteSize = hourSize / 60.0;
        const secondSize = minuteSize / 60.0;

        let angle = this.limitAngleDeg(deg);

        const hour = Math.floor(angle / hourSize);
        const minute = Math.floor((angle - hour * hourSize) / minuteSize);
        const second = (angle - hour*hourSize - minute*minuteSize) / secondSize;

        return {hour : hour, minute : minute, second : second};
    }

    /**
     * Convert angle in hour-min-sec format to degrees.
     * 
     * @param {number} hour 
     *      Hours.
     * @param {number} minute
     *      Minutes. 
     * @param {number} second 
     *      Seconds
     * @returns {number} The angle in degrees.
     */
    static angleHmsDeg(hour : number, minute : number, second : number) : number
    {
        const hourSize = 360.0 / 24.0;
        const minuteSize = hourSize / 60.0;
        const secondSize = minuteSize / 60.0;

        return this.limitAngleDeg(hour*hourSize + minute*minuteSize + second*secondSize);
    }
}