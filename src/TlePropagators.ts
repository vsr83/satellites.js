import {Tle} from "./Tle";
import {MathUtils} from "./computation/MathUtils";

/*const sgp4Constants = {
    mu : 398600.5,               // km^3/s^2
    radiusEarthKm : 6378.137,    // km
    xke : 7.436685316871385e-02, // 1/s
    //xke : 0.074366916133173,
    tumin : 13.44685108204498,   // s
    j2 : 0.00108262998905,
    j3 : -0.00000253215306,
    j4 : -0.00000161098761,
    j3oj2 : -2.338890558742000e-03
};*/

/**
 * The SGP4 is based on the WGS72 reference standard. 
 * Apparently use of WGS84 constants would yield problems since the TLEs are created using a least-squares fit.
 */
const sgp4Constants = {
    mu : 398600.8,               // km^3/s^2
    radiusEarthKm : 6378.135,    // km
    xke : 7.436691613317342e-02, // 1/s
    //xke : 0.074366916133173,
    tumin : 13.44683969695931,   // s
    j2 : 0.001082616,
    j3 : -0.00000253881,
    j4 : -0.00000165597,
    j3oj2 : -2.345069720011528e-03
};

export interface Sgp4DragTerms
{
    s : number,
    c1 : number,
    c2 : number,
    c3 : number,
    c4 : number,
    c5 : number,
    d2 : number,
    d3 : number,
    d4 : number,
    t2cof : number,
    t3cof : number,
    t4cof : number,
    t5cof : number,
    xmcof : number
}

export interface Sgp4GravityTerms
{
    meanAnomalyDot : number,
    argPerigeeDot : number,
    lonAscNodeDot : number
}

export interface BrouwerElements
{
    meanMotionBrouwer : number, 
    semiMajorAxisBrouwer : number
}

export class Sgp4Propagation
{
    tle : Tle;
    // The constant used for 
    s : number; 

    inclinationRadsEpoch : number;
    argPerigeeRadsEpoch : number;
    meanAnomalyRadsEpoch : number;
    raAscNodeRadsEpoch : number;
    
    dragTerms : Sgp4DragTerms;
    gravityTerms : Sgp4GravityTerms;
    brouwerElements : BrouwerElements;

    gmstEpoch : number;

    constructor(tle : Tle)
    {
        this.tle = tle;
    }

    /**
     * Compute Greenwich Mean Sidereal Time. This is a copy from the SGP4 implementation by
     * David Vallado.
     * 
     * @param {number} jtUt1 
     *      Julian time (UT1).
     * @returns {number} GMST in radians.
     */
    gstime(jtUt1 : number) : number
    {
        // Julian centuries after the J2000.0 epoch.
        const T = (jtUt1 - 2451545.0) / 36525.0;
        const twoPi = 2.0 * Math.PI;

        let temp = -6.2e-6* T * T * T + 0.093104 * T * T 
                 + (876600.0 * 3600 + 8640184.812866) * T + 67310.54841;
        temp = temp * Math.PI / (240.0 * 180.0) % twoPi;

        if (temp < 0.0)
        {
            temp += twoPi;
        }

        return temp;
    }

    /**
     * Compute secular perturbations due to J2 and J4 harmonics in the gravitational potential.
     * 
     * Perturbations in the mean anomaly, argument of perigee and longitude of ascending
     * node are taken into account by computation of a time derivative at Epoch and then affine 
     * appproximation.
     * 
     * @returns {Object} JSON with fields meanAnomalyDot, argPerigeeDot and lonPeriDot for
     *      the time derivatives (radians / minute) of the mean anomaly, argument of perigee and
     *      longitude of perigee. 
     */
    computeGravityPerturbations() : Sgp4GravityTerms
    {
        const cosInclination : number = Math.cos(this.inclinationRadsEpoch);
        const cosInclinationSq : number = cosInclination * cosInclination;
        const cosInclination4 : number = cosInclinationSq * cosInclinationSq;
        const eccSqu : number = this.tle.eccentricity * this.tle.eccentricity;
        const oneMinusEccSqu : number = 1 - eccSqu;
        const sqrtOneMinusEccSqu : number = Math.sqrt(oneMinusEccSqu);

        // Brouwer semi-latus rectum (earth radii) [po].
        const semiLatusRectum : number = this.brouwerElements.semiMajorAxisBrouwer * oneMinusEccSqu;

        const pinvsq = 1 / (semiLatusRectum * semiLatusRectum);

        const temp1 = 1.5 * sgp4Constants.j2 * pinvsq * this.brouwerElements.meanMotionBrouwer;
        const temp2 = 0.5 * temp1 * sgp4Constants.j2 * pinvsq;
        const temp3 = -0.46875 * sgp4Constants.j4 * pinvsq * pinvsq * this.brouwerElements.meanMotionBrouwer;
        const meanAnomalyDot = this.brouwerElements.meanMotionBrouwer + 0.5 * temp1 * sqrtOneMinusEccSqu * (-1.0 + 3.0 * cosInclinationSq) + 0.0625 *
            temp2 * sqrtOneMinusEccSqu * (13.0 - 78.0 * cosInclinationSq + 137.0 * cosInclination4);
        const argPerigeeDot = -0.5 * temp1 * (1.0 - 5.0 * cosInclinationSq) + 0.0625 * temp2 *
            (7.0 - 114.0 * cosInclinationSq + 395.0 * cosInclination4) +
            temp3 * (3.0 - 36.0 * cosInclinationSq + 49.0 * cosInclination4);
        const xhdot1 = -temp1 * cosInclination;
        const lonAscNodeDot = xhdot1 + (0.5 * temp2 * (4.0 - 19.0 * cosInclinationSq) +
            2.0 * temp3 * (3.0 - 7.0 * cosInclinationSq)) * cosInclination;

        return {
            meanAnomalyDot : meanAnomalyDot,
            argPerigeeDot : argPerigeeDot,
            lonAscNodeDot : lonAscNodeDot
        };
    }

    /**
     * Compute secular perturbations from drag according to SGP4 model.
     * 
     * @returns {Sgp4DragTerms} The coefficients required by drag computation.
     */
    computeDragPertubationsSgp4() : Sgp4DragTerms
    {
        /* 
         * The acceleration due to drag
         * a_D = (\rho / \rho_0) * Bstar * v^2, where rho is air density, Bstar is the drag term obtained from the TLE, 
         * v the velocity the satellite w.r.t. the EFI frame and 
         * \rho = \rho_0 (\frac{q_0 - s}{r-s})^4,
         * where q_0 = 120 km + Earth radius. 
         */

        const eccSqu : number = this.tle.eccentricity * this.tle.eccentricity;
        const oneMinusEccSqu : number = 1 - eccSqu;
        const cosInclination : number = Math.cos(this.inclinationRadsEpoch);
        const cosInclinationSq : number = cosInclination * cosInclination;
        const sinInclination : number = Math.sin(this.inclinationRadsEpoch);

        // Minimum distance at perigee (in Earth radii) [rp].
        const rPerigee = this.brouwerElements.semiMajorAxisBrouwer * (1.0 - this.tle.eccentricity);

        // Satellite altitude at perigee assuming ideal sphere (km) [perige].
        const perigeeAltitudeKm = (rPerigee - 1.0) * sgp4Constants.radiusEarthKm;

        // The parameter s is related to atmospheric density representation
        // \rho = \rho_0 (\frac{q_0 - s}{r - s})^4, where q_0 is geocentric reference altitude.
        // The main outputs from the following are the s and (q_0 - s)^4:
        let s, qs4Term, sTemp;
        if (perigeeAltitudeKm < 98.0)
        {
            sTemp = 20;
        }
        else if (perigeeAltitudeKm < 156.0)
        {
            sTemp = perigeeAltitudeKm - 78;
        }
        else 
        {
            sTemp = 78;
        }
        s = sTemp / sgp4Constants.radiusEarthKm + 1.0;
        qs4Term = Math.pow((120 - sTemp) / sgp4Constants.radiusEarthKm, 4.0);
       
        // [tsi], [eta], [etasq], [eeta], [psisq], [coef], [coef1]
        const xi = 1.0 / (this.brouwerElements.semiMajorAxisBrouwer - s);
        const eta = this.brouwerElements.semiMajorAxisBrouwer * this.tle.eccentricity * xi;
        const eta2 = eta * eta;
        const eeta = this.tle.eccentricity * eta;
        const psi2 = Math.abs(1.0 - eta2);
        const coef = qs4Term * Math.pow(xi, 4.0);
        const coef1 = coef / Math.pow(psi2, 3.5);

        // const con42 =  1.0 - 5.0 * cosInclinationSq;
        // const con41 = -1.0 + 3.0 * cosInclinationSq;

        const cc2 = coef1 * this.brouwerElements.meanMotionBrouwer * (this.brouwerElements.semiMajorAxisBrouwer * (1.0 + 1.5 * eta2 + eeta *
            (4.0 + eta2)) + 0.375 * sgp4Constants.j2 * xi / psi2 * (-1.0 + 3.0 * cosInclinationSq) *
            (8.0 + 3.0 * eta2 * (8.0 + eta2)));
        const cc1 = this.tle.dragTerm * cc2;
        let cc3 = 0.0;
        let xmcof = 0.0;
        if (this.tle.eccentricity > 1.0e-4)
        {
            cc3 = -2.0 * coef * xi * sgp4Constants.j3oj2 * this.brouwerElements.meanMotionBrouwer * sinInclination / this.tle.eccentricity;
            xmcof = -(2.0 / 3.0) * coef * this.tle.dragTerm / eeta;
        }
        const x1mth2 = 1.0 - cosInclinationSq;
        const cc4 = 2.0* this.brouwerElements.meanMotionBrouwer * coef1 * this.brouwerElements.semiMajorAxisBrouwer * oneMinusEccSqu *
                    (eta * (2.0 + 0.5 * eta2) + this.tle.eccentricity *
                    (0.5 + 2.0 * eta2) - sgp4Constants.j2 * xi / (this.brouwerElements.semiMajorAxisBrouwer * psi2) *
                    (-3.0 * (-1.0 + 3.0 * cosInclinationSq) * (1.0 - 2.0 * eeta + eta2 *
                    (1.5 - 0.5 * eeta)) + 0.75 * x1mth2 *
                    (2.0 * eta2 - eeta * (1.0 + eta2)) * Math.cos(2.0 * this.argPerigeeRadsEpoch)));
        const cc5 = 2.0 * coef1 * this.brouwerElements.semiMajorAxisBrouwer * oneMinusEccSqu * (1.0 + 2.75 *
                    (eta2 + eeta) + eeta * eta2);

        const cc1sq = cc1 * cc1;

        // Coefficients for 2-4 order (t-t_0)^k drag terms in the expansion of semi-major axis.
        const d2 = 4.0 * this.brouwerElements.semiMajorAxisBrouwer * xi * cc1sq;
        const temp = d2 * xi * cc1 / 3.0;
        const d3 = (17.0 * this.brouwerElements.semiMajorAxisBrouwer + s) * temp;
        const d4 = 0.5 * temp * this.brouwerElements.semiMajorAxisBrouwer * xi * (221.0 * this.brouwerElements.semiMajorAxisBrouwer + 31.0 * s) * cc1;

        // Coefficients for higher-order (t-t_0)^k drag terms in the expansion for mean longitude.
        const t2cof = 1.5 * cc1;
        const t3cof = d2 + 2.0 * cc1sq;
        const t4cof = 0.25 * (3.0 * d3 + cc1 * (12.0 * d2 + 10.0 * cc1sq));
        const t5cof = 0.2 * (3.0 *d4 + 12.0 * cc1 * d3 + 6.0 * d2 * d2 + 15.0 * cc1sq * (2.0 * d2 + cc1sq));

        return {
            s : s,
            c1 : cc1,
            c2 : cc2,
            c3 : cc3,
            c4 : cc4,
            c5 : cc5,
            d2 : d2,
            d3 : d3,
            d4 : d4,
            t2cof : t2cof,
            t3cof : t3cof,
            t4cof : t4cof,
            t5cof : t5cof,
            xmcof : xmcof
        };
    }

    /**
     * Compute Brouwer mean motion and semi-major axis from Kozai mean motion.
     * 
     * The TLEs are given using Kozai mean elements while the internal model of SGP4 is based on the 
     * Brouwer theory with added drag corrections that uses Brouwer mean elements.
     * 
     * @returns {BrouwerElements} The Brouwer mean elements
     */
    computeBrouwer() : BrouwerElements
    {
        // Inverse of the radians per minute Earth rotates w.r.t. Sun.
        const earthRadsPerMinInv = 1440.0 / (2.0 * Math.PI);
        const oneMinusEccSqu : number = 1 - this.tle.eccentricity * this.tle.eccentricity;
        const cosInclination : number = Math.cos(this.inclinationRadsEpoch);

        // Kozai mean element for the mean motion of the satellite (radians / minute) [no_kozai].
        const meanMotionKozai : number = this.tle.meanMotion / earthRadsPerMinInv;
        // First time derivative of the mean motion of the satellite (radians / minute^2) [ndot].
        //const meanMotionKozaiDot : number = this.tle.meanMotionDer / (1440.0 * earthRadsPerMinInv);
        // Second time derivative of the mean motion of the satellite (radians / minute^3) [nddot].
        //const meanMotionKozaiDDot : number = this.tle.meanMotionDer2 / (1440.0 * 1440.0 * earthRadsPerMinInv);
        // Kozai mean element for the semi-major axis computed from Kepler's third law (Earth radii) [ak].
        const semiMajorAxisKozai : number = Math.pow(sgp4Constants.xke / meanMotionKozai, 2.0 / 3.0);

        // Convert Kozai mean element for mean motion to Brouwer mean element for mean motion [del]:
        const d1 : number = 0.75 * sgp4Constants.j2 * (3.0 * cosInclination * cosInclination - 1.0) 
                          / (Math.sqrt(oneMinusEccSqu) * oneMinusEccSqu);
        let del : number = d1 / (semiMajorAxisKozai * semiMajorAxisKozai)
        const adel : number = semiMajorAxisKozai * (1 - del * (1.0 / 3.0 + del * (1.0 + (134.0 / 81.0) * del)));
        del = d1 / (adel * adel);
        
        // Brouwer element for the mean motion (radians / minute) [no_unkozai].
        const meanMotionBrouwer : number = meanMotionKozai / (1.0 + del);
        // Brouwer element for the semi-major axis (Earth radii) [ao]
        const semiMajorAxisBrouwer : number = Math.pow(sgp4Constants.xke / meanMotionBrouwer, 2.0 / 3.0);
        // Brouwer semi-latus rectum (earth radii) [po].
        const semiLatusRectum : number = semiMajorAxisBrouwer * oneMinusEccSqu;

        return {
            meanMotionBrouwer : meanMotionBrouwer, 
            semiMajorAxisBrouwer : semiMajorAxisBrouwer
        };   
    }

    /**
     * Perform initialization of SGP4 with the TLE data.
     */
    initialize()
    {
        this.inclinationRadsEpoch = MathUtils.deg2Rad(this.tle.inclination);
        this.argPerigeeRadsEpoch = MathUtils.deg2Rad(this.tle.argPerigee);
        this.meanAnomalyRadsEpoch = MathUtils.deg2Rad(this.tle.meanAnomaly);
        this.raAscNodeRadsEpoch = MathUtils.deg2Rad(this.tle.raAscNode);

        // Inverse of the radians per minute Earth rotates w.r.t. Sun.
        const earthRadsPerMinInv = 1440.0 / (2.0 * Math.PI);

        // Convert mean motion variables from revolutions/day to radians/min:    
        this.brouwerElements = this.computeBrouwer();

        // Compute Greenwich sidereal time at epoch (in radians) [gsto]:
        this.gmstEpoch = this.gstime(this.tle.jtUt1Epoch);

        // Compute time derivatives in perturbation terms due to gravitational harmonics.
        this.gravityTerms = this.computeGravityPerturbations();

        // Compute coefficients for perturbation terms due to drag.
        this.dragTerms = this.computeDragPertubationsSgp4();
    }

    /**
     * Compute Orbit State Vector (OSV)
     * 
     * @param {number} su 
     *      Osculating sum of the eccentric anomaly and the argument of periapsis (radians)
     * @param {number} xnode 
     *      Osculating longitude of ascending node (radians)
     * @param {number} xinc 
     *      Osculating inclination (radians)
     * @param {number} mrt 
     *      Distance from the geocenter (Earth radii).
     * @param {number} mvt 
     *      
     * @param {number} rvdot 
     * 
     * @returns The orbit state vector.
     */
    computeOsv(su : number, xnode : number, xinc : number, mrt : number, mvt : number, rvdot : number)
    {
        /* --------------------- orientation vectors ------------------- */
        const sinsu = Math.sin(su);
        const cossu = Math.cos(su);
        const snod = Math.sin(xnode);
        const cnod = Math.cos(xnode);
        const sini = Math.sin(xinc);
        const cosi = Math.cos(xinc);
        const xmx = -snod * cosi;
        const xmy = cnod * cosi;
        const ux = xmx * sinsu + cnod * cossu;
        const uy = xmy * sinsu + snod * cossu;
        const uz = sini * sinsu;
        const vx = xmx * cossu - cnod * sinsu;
        const vy = xmy * cossu - snod * sinsu;
        const vz = sini * cossu;

        /* --------- position and velocity (in km and km/sec) ---------- */
        const r = [0, 0, 0];
        const v = [0, 0, 0];
        const vkmpersec = sgp4Constants.radiusEarthKm * sgp4Constants.xke / 60.0;

        r[0] = (mrt * ux) * sgp4Constants.radiusEarthKm;
        r[1] = (mrt * uy) * sgp4Constants.radiusEarthKm;
        r[2] = (mrt * uz) * sgp4Constants.radiusEarthKm;
        v[0] = (mvt * ux + rvdot * vx) * vkmpersec;
        v[1] = (mvt * uy + rvdot * vy) * vkmpersec;
        v[2] = (mvt * uz + rvdot * vz) * vkmpersec;

        return {r : r, v: v};
    }

    /**
     * Apply secular perturbations to the mean elements.
     * 
     * @param {number} tSince 
     *      Minutes since epoch.
     * @returns 
     */
    applySecularPerturbations(tSince : number)
    {
        const t2 = tSince * tSince;
        const t3 = t2 * tSince;
        const t4 = t3 * tSince;
        const t5 = t4 * tSince;
        const twopi = 2.0 * Math.PI;

        const oneMinusEccSqu : number = 1 - this.tle.eccentricity * this.tle.eccentricity;
        // Brouwer semi-latus rectum (earth radii) [po].
        const semiLatusRectum : number = this.brouwerElements.semiMajorAxisBrouwer * oneMinusEccSqu;

        // Kozai mean elements with secular gravitational perturbations:
        const xmdf   = this.meanAnomalyRadsEpoch + this.gravityTerms.meanAnomalyDot * tSince;
        const argpdf = this.argPerigeeRadsEpoch  + this.gravityTerms.argPerigeeDot * tSince;
        const nodedf = this.raAscNodeRadsEpoch   + this.gravityTerms.lonAscNodeDot * tSince;

        const xi = 1.0 / (this.brouwerElements.semiMajorAxisBrouwer - this.dragTerms.s);
        const eta = this.brouwerElements.semiMajorAxisBrouwer * this.tle.eccentricity * xi;
        const delmotemp = 1.0 + eta * Math.cos(this.meanAnomalyRadsEpoch);
        const delmo = delmotemp * delmotemp * delmotemp;

        const pinvsq = 1 / (semiLatusRectum * semiLatusRectum);
        const temp1 = 1.5 * sgp4Constants.j2 * pinvsq * this.brouwerElements.meanMotionBrouwer;
        const xhdot1 = -temp1 * Math.cos(this.inclinationRadsEpoch);

        const nodeCf = 3.5 * oneMinusEccSqu * xhdot1 * this.dragTerms.c1;
        const nodem = (nodedf + nodeCf * t2) % twopi;

        // Compute drag term for argument of perihelion.
        const delomg = this.tle.dragTerm * this.dragTerms.c3 * Math.cos(this.argPerigeeRadsEpoch) * tSince;
        // Compute drag term for mean anomaly.
        const delm = this.dragTerms.xmcof * (Math.pow(1.0 + eta * Math.cos(xmdf), 3.0) - delmo);

        // Kozai mean element for mean anomaly with
        const mmtemp = xmdf + delomg + delm;
        const argpm = (argpdf - delomg - delm) % twopi;

        // Compute the time-dependent parts of the drag terms as polynomial expansions of (t - t_0).
        const tempa = 1 
                    - this.dragTerms.c1 * tSince 
                    - this.dragTerms.d2 * t2 
                    - this.dragTerms.d3 * t3 
                    - this.dragTerms.d4 * t4;
        const tempe = this.tle.dragTerm * this.dragTerms.c4 * tSince 
                    + this.tle.dragTerm * this.dragTerms.c5 * (Math.sin(mmtemp) -Math.sin(this.meanAnomalyRadsEpoch));
        const templ = this.dragTerms.t2cof * t2 
                    + this.dragTerms.t3cof * t3 
                    + this.dragTerms.t4cof * t4 
                    + this.dragTerms.t5cof * t5;

        let inclm = this.inclinationRadsEpoch;

        // This could be done already in the initialization.
        if (this.brouwerElements.meanMotionBrouwer <= 0.0)
        {
            // Error
        }
        // Apply correction terms to Brouwer semi-major axis.
        let am = this.brouwerElements.semiMajorAxisBrouwer * tempa * tempa;
        // Compute mean motion from the corrected semi-major axis.
        let nm = sgp4Constants.xke / Math.pow(am, 1.5);
        // Apply drag correction terms to the mean eccentricity at epoch.
        let em = this.tle.eccentricity - tempe;
        //
        const im = this.inclinationRadsEpoch;

        // fix tolerance for error recognition
        // sgp4fix am is fixed from the previous nm check
        if ((em >= 1.0) || (em < -0.001)/* || (am < 0.95)*/)
        {
            // error
        }
        // sgp4fix fix tolerance to avoid a divide by zero
        if (em < 1.0e-6)
            em = 1.0e-6;

        const mm = (mmtemp + this.brouwerElements.meanMotionBrouwer * templ) % twopi;    

        return {am : am, em : em, im : im, nodem : nodem, argpm : argpm, mm : mm, nm : nm};
    }

    keplerSolve(axnl : number, aynl : number, u : number)
    {
        //const u = (xl - nodem) % twopi;
        let eo1 = u;
        let tem5 = 9999.9;
        let ktr = 1;
        let sineo1 = 0;
        let coseo1 = 0;
        //   sgp4fix for kepler iteration
        //   the following iteration needs better limits on corrections
        while ((Math.abs(tem5) >= 1.0e-12) && (ktr <= 10))
        {
            sineo1 = Math.sin(eo1);
            coseo1 = Math.cos(eo1);
            tem5 = 1.0 - coseo1 * axnl - sineo1 * aynl;
            tem5 = (u - aynl * coseo1 + axnl * sineo1 - eo1) / tem5;
            if (Math.abs(tem5) >= 0.95)
                tem5 = tem5 > 0.0 ? 0.95 : -0.95;
            eo1 = eo1 + tem5;
            ktr = ktr + 1;
        }

        return eo1;
    }

    compute(tSince : number)
    {
        const twopi = 2.0 * Math.PI;

        // Mean Brouwer elements with secular perturbations.
        const {am, em, im, nodem, argpm, mm, nm} = this.applySecularPerturbations(tSince);

        const xlcof = -0.25 * sgp4Constants.j3oj2 * Math.sin(this.inclinationRadsEpoch) 
                    * (3.0 + 5.0 * Math.cos(this.inclinationRadsEpoch)) 
                    / Math.max(1.0 + Math.cos(this.inclinationRadsEpoch), 1e-12);

        const axnl = em * Math.cos(argpm);
        const temp = 1.0 / (am * (1.0 - em * em));
        const aycof = -0.5 * sgp4Constants.j3oj2 * Math.sin(this.inclinationRadsEpoch);
        const aynl = em * Math.sin(argpm) + temp * aycof;

        const xl = mm + argpm + nodem + temp * xlcof * axnl; 

        // The parameter u is mean longitude minus the longitude of the ascending node.
        const u = (xl - nodem) % twopi;

        // The sum of eccentric anomaly and the argument of perihelion.
        const eo1 = this.keplerSolve(axnl, aynl, u);
        const sineo1 = Math.sin(eo1);
        const coseo1 = Math.cos(eo1);

        /* ------------- short period preliminary quantities ----------- */
        const ecose = axnl*coseo1 + aynl*sineo1;
        const esine = axnl*sineo1 - aynl*coseo1;
        const el2 = axnl*axnl + aynl*aynl;
        const pl = am * (1.0 - el2);

        if (pl < 0.0)
        {
            //satrec->error = 4;
            // sgp4fix add return
            //return FALSE;
        }
        else
        {
            const rl = am * (1.0 - ecose);
            const rdotl = Math.sqrt(am) * esine / rl;
            const rvdotl = Math.sqrt(pl) / rl;
            const betal = Math.sqrt(1.0 - el2);
            let temp = esine / (1.0 + betal);
            const sinu = am / rl * (sineo1 - aynl - axnl * temp);
            const cosu = am / rl * (coseo1 - axnl + aynl * temp);
            let su = Math.atan2(sinu, cosu);
            const sin2u = (cosu + cosu) * sinu;
            const cos2u = 1.0 - 2.0 * sinu * sinu;
            temp = 1.0 / pl;
            const temp1 = 0.5 * sgp4Constants.j2 * temp;
            const temp2 = temp1 * temp;
            const cosio2 = Math.cos(this.inclinationRadsEpoch) * Math.cos(this.inclinationRadsEpoch);
            const con42 = 1.0 - 5.0 * cosio2;
            const con41 = -con42 - cosio2 - cosio2;
            const x1mth2 = 1.0 - cosio2;
            const x7thm1 = 7.0 * cosio2 - 1.0;
            const cosim = Math.cos(this.inclinationRadsEpoch);
            const sinim = Math.sin(this.inclinationRadsEpoch);

            const mrt = rl * (1.0 - 1.5 * temp2 * betal * con41) +
                0.5 * temp1 * x1mth2 * cos2u;
            su = su - 0.25 * temp2 * x7thm1 * sin2u;
            // 
            const xnode = nodem + 1.5 * temp2 * cosim * sin2u;
            const xinc = this.inclinationRadsEpoch + 1.5 * temp2 * cosim * sinim * cos2u;
            const mvt = rdotl - nm * temp1 * x1mth2 * sin2u / sgp4Constants.xke;
            const rvdot = rvdotl + nm * temp1 * (x1mth2 * cos2u +
                1.5 * con41) / sgp4Constants.xke;

            const {r, v} = this.computeOsv(su, xnode, xinc, mrt, mvt, rvdot);
            console.log("r " + r);
            console.log("v " + v);
        }  // if pl > 0        
    }

}