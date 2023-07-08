import { NutationData } from "./Nutation";
import { Angles } from "./Angles";
import { MathUtils } from "./MathUtils";

/**
 * Class with static methods for the computation of Greenwich Sidereal Time.
 */
export class SiderealTime
{
    /**
     * Compute Greenwich Mean Sidereal Time (GMST).
     * 
     * References: 
     *  [1] S. Urban, K. Seidelmann - Explanatory Supplement to the Astronomical Almanac,
     *      3rd edition, 2013.
     * 
     * @param {number} JTut1 
     *      Julian time (UT1)
     * @param {number} JTtt 
     *      Julian time (TT). If undefined, time correlation data is used.
     * @returns GMST time.
     */
    static timeGmst(JTut1 : number, JTtdb : number) : number
    {
        const DU = JTut1 - 2451545.0;
        const T = (JTtdb - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;
        const T4 = T3*T;
        const T5 = T4*T;

        // Equation (6.64).
        const GMST = 86400.0 * (0.7790572732640 + 0.00273781191135448 * DU + DU % 1.0)
                + 0.00096707 + 307.47710227 * T + 0.092772113 * T2 - 2.93e-8 * T3 
                - 1.99708e-5 * T4 - 2.453e-9 * T5;

        return (GMST * 360.0 / 86400.0) % 360.0;
    } 
    

    /**
     * Compute Greenwich Apparent Sidereal Time (GAST).
     * 
     * References:
     *  [1] E. Suirana, J. Zoronoza, M. Hernandez-Pajares - GNSS Data Processing -
     *  Volume I: Fundamentals and Algorithms, ESA 2013. 
     * 
     * @param {*} JT 
     *      Julian time.
     * @param {*} nutParams
     *      Nutation parameters. If missing, the parameters are computed from JT. 
     */
    static timeGast(JTut1 : number, JTtdb : number, nutParams : NutationData) : number
    {
        const GMST = this.timeGmst(JTut1, JTtdb);

        // The equinox equation (A.37) for GAST
        //return limitAngleDeg(GMST - atand(N12 / N11));
        return Angles.limitAngleDeg(GMST + nutParams.dpsi * MathUtils.cosd(nutParams.eps));
    }
}