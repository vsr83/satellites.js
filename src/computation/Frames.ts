import { TimeConvention, TimeCorrelation, TimeStamp } from "./TimeCorrelation";
import { Rotations} from "./Rotations";
import { NutationData } from "./Nutation";
import { SiderealTime } from "./SiderealTime";
import { MathUtils } from "./MathUtils";
import { EarthPosition, Wgs84 } from "./Wgs84";

/**
 * Enumeration of supported frames.
 */
export enum Frame 
{
    FRAME_ECLHEL,
    FRAME_ECLGEO,
    FRAME_J2000,
    FRAME_MOD,
    FRAME_TOD,
    FRAME_PEF,
    FRAME_EFI,
    FRAME_ENU,
    FRAME_PERI,
    FRAME_FUND
}

/**
 * Interface describing Orbit State Vector (OSV) input given in specific
 * frame with time correlation data available.
 */
export interface OsvFrame
{
    frame : Frame;
    timeStamp : TimeStamp;
    position : number[];
    velocity : number[];
}

/**
 * Interface for angles in the ENU frame.
 */
export interface EnuAngles
{
    az : number;
    el : number;
    dazdt : number; 
    deldt : number; 
    dist : number;
}

/**
 * Interface describing Orbit State Vector (OSV) output from the functionality.
 */
export interface OsvOutput
{
    eclHel : OsvFrame;
    eclGeo : OsvFrame;
    j2000  : OsvFrame;
    mod    : OsvFrame;
    tod    : OsvFrame;
    pef    : OsvFrame;
    efi    : OsvFrame;
    enu    : OsvFrame;
}

export class Frames
{
    /**
     * Transform OSV to all frames.
     * 
     * @param {OsvFrame} osvIn
     *      Input OSV in any frame. 
     * @param {OsvFrame} osvHelEarth 
     *      Position of the Earth in the ecliptic heliocentric frame.
     * @param {EarthPosition} obsPos 
     *      Observer position on Earth.
     * @param {NutationData} nutData
     *      Nutation data. 
     * @returns {OsvOutput} Object with OSVs for every frame.
     */
    static computeAll(osvIn : OsvFrame, osvHelEarth : OsvFrame, 
        obsPos : EarthPosition, nutData : NutationData) : OsvOutput
    {
        let osvEclHel;
        let osvEclGeo;
        let osvJ2000;
        let osvMoD;
        let osvToD;
        let osvPef;
        let osvEfi;
        let osvEnu;

        if (osvIn.frame == Frame.FRAME_ECLGEO)
        {
            osvEclGeo = osvIn;
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvJ2000 = this.coordEclEq(osvEclGeo);
            osvMoD = this.coordJ2000Mod(osvJ2000);
            osvToD = this.coordModTod(osvMoD, nutData);
            osvPef = this.coordTodPef(osvToD, nutData);
            osvEfi = this.coordPefEfi(osvPef);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_ECLHEL)
        {
            osvEclHel = osvIn;
            osvEclGeo = this.coordHelEcl(osvEclHel, osvHelEarth);
            osvJ2000 = this.coordEclEq(osvEclGeo);
            osvMoD = this.coordJ2000Mod(osvJ2000);
            osvToD = this.coordModTod(osvMoD, nutData);
            osvPef = this.coordTodPef(osvToD, nutData);
            osvEfi = this.coordPefEfi(osvPef);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_J2000)
        {
            osvJ2000 = osvIn;
            osvEclGeo = this.coordEqEcl(osvJ2000);
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvMoD = this.coordJ2000Mod(osvJ2000);
            osvToD = this.coordModTod(osvMoD, nutData);
            osvPef = this.coordTodPef(osvToD, nutData);
            osvEfi = this.coordPefEfi(osvPef);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_MOD)
        {
            osvMoD = osvIn;
            osvJ2000 = this.coordModJ2000(osvMoD);
            osvEclGeo = this.coordEqEcl(osvJ2000);
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvToD = this.coordModTod(osvMoD, nutData);
            osvPef = this.coordTodPef(osvToD, nutData);
            osvEfi = this.coordPefEfi(osvPef);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_TOD)
        {
            osvToD = osvIn;
            osvMoD = this.coordTodMod(osvToD, nutData);
            osvJ2000 = this.coordModJ2000(osvMoD);
            osvEclGeo = this.coordEqEcl(osvJ2000);
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvPef = this.coordTodPef(osvToD, nutData);
            osvEfi = this.coordPefEfi(osvPef);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_PEF)
        {
            osvPef = osvIn;
            osvToD = this.coordPefTod(osvPef, nutData);
            osvMoD = this.coordTodMod(osvToD, nutData);
            osvJ2000 = this.coordModJ2000(osvMoD);
            osvEclGeo = this.coordEqEcl(osvJ2000);
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvEfi = this.coordPefEfi(osvPef);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_EFI)
        {
            osvEfi = osvIn;
            osvPef = this.coordEfiPef(osvEfi);
            osvToD = this.coordPefTod(osvPef, nutData);
            osvMoD = this.coordTodMod(osvToD, nutData);
            osvJ2000 = this.coordModJ2000(osvMoD);
            osvEclGeo = this.coordEqEcl(osvJ2000);
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }
        if (osvIn.frame == Frame.FRAME_ENU)
        {
            osvEnu = osvIn;
            osvEfi = this.coordEnuEfi(osvEnu, obsPos);
            osvPef = this.coordEfiPef(osvEfi);
            osvToD = this.coordPefTod(osvPef, nutData);
            osvMoD = this.coordTodMod(osvToD, nutData);
            osvJ2000 = this.coordModJ2000(osvMoD);
            osvEclGeo = this.coordEqEcl(osvJ2000);
            osvEclHel = this.coordEclHel(osvEclGeo, osvHelEarth);
            osvEnu = this.coordEfiEnu(osvEfi, obsPos);
        }

        return {
            eclHel : osvEclHel,
            eclGeo : osvEclGeo,
            j2000  : osvJ2000,
            mod    : osvMoD,
            tod    : osvToD,
            pef    : osvPef,
            efi    : osvEfi,
            enu    : osvEnu
        }
    }

    /**
     * Convert coordinates from heliocentric ecliptic to geocentric ecliptic
     * frame.
     * 
     * @param {OsvFrame} osv 
     *      OSV in heliocentric ecliptic frame.
     * @param {OsvFrame} osvEarth
     *      Position of the Earth in heliocentric ecliptic frame.
     */
    static coordHelEcl(osv : OsvFrame, osvEarth : OsvFrame) : OsvFrame
    {
        const r = MathUtils.vecDiff(osv.position, osvEarth.position);
        const v = MathUtils.vecDiff(osv.velocity, osvEarth.velocity);

        return {
            frame : Frame.FRAME_ECLGEO,
            position : r, velocity : v, timeStamp : osv.timeStamp
        };
    }

    /**
     * Convert coordinates from geocentric ecliptic to heliocentric ecliptic
     * frame.
     * 
     * @param {OsvFrame} osv 
     *      OSV in geocentric ecliptic frame.
     * @param {OsvFrame} osvEarth
     *      Position of the Earth in heliocentric ecliptic frame.
     */
    static coordEclHel(osv : OsvFrame, osvEarth : OsvFrame) : OsvFrame
    {
        const r = MathUtils.vecSum(osv.position, osvEarth.position);
        const v = MathUtils.vecSum(osv.velocity, osvEarth.velocity);

        return {
            frame : Frame.FRAME_ECLHEL,
            position : r, velocity : v, timeStamp : osv.timeStamp
        };
    }

    /**
     * Convert coordinates from geocentric ecliptic frame to J2000. 
     * 
     * @param {OsvFrame} osv
     *      OSV in heliocentric ecliptic frame. 
     * 
     * @returns {OsvFrame} OSV in J2000 frame.
     */
    static coordEclEq(osv : OsvFrame) : OsvFrame
    {
        // Mean obiquity of the ecliptic at the J2000 epoch.
        // Since the obliquity is at a specific epoch, it is a constant.
        // The value is from 2010 version of the Astronomical Almanac p. B52.
        const eps = 23.439279444444445;
        const rEq = Rotations.rotateCart1d(osv.position, -eps);

        // The change in eps is less than arcminute in century. Thus, the influence to the
        // velocity of objects in the solar system is small.
        const vEq = Rotations.rotateCart1d(osv.velocity, -eps);

        return {frame : Frame.FRAME_J2000,
            position : rEq, velocity : vEq, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from equatorial to ecliptic system.
     * 
     * @param {Frame} osv
     *      OSV in equatorial frame.
     * @returns {OsvFrame} OSV in ecliptic frame.
     */
    static coordEqEcl(osv : OsvFrame) : OsvFrame
    {
        // Mean obiquity of the ecliptic at the J2000 epoch.
        // Since the obliquity is at a specific epoch, it is a constant.
        // The value is from 2010 version of the Astronomical Almanac p. B52.
        const eps = 23.439279444444445;

        const rEcl = Rotations.rotateCart1d(osv.position, eps);
        const vEcl = Rotations.rotateCart1d(osv.velocity, eps);

        return {frame : Frame.FRAME_ECLGEO,
            position : rEcl, velocity : vEcl, timeStamp : osv.timeStamp}
    }

    /**
     * Convert coordinates from J2000 to the Mean-of-Date (MoD) frame.
     * 
     * The implementation follows Lieske, J.  - Precession matrix based on
     * IAU/1976/ system of astronomical constants, Astronomy and Astrophysics
     * vol. 73, no. 3, Mar 1979, p.282-284.
     * 
     * @param {OsvFrame} osv
     *      OSV in J2000 frame.
     * @returns {OsvFrame} OSV in MoD frame.
     */
    static coordJ2000Mod(osv : OsvFrame) : OsvFrame
    {
        // Julian centuries after J2000.0 epoch.
        const T = (osv.timeStamp.JTtdb - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;

        const z =      0.6406161388 * T + 3.0407777777e-04 * T2 + 5.0563888888e-06 * T3;
        const theta =  0.5567530277 * T - 1.1851388888e-04 * T2 - 1.1620277777e-05 * T3;
        const zeta =   0.6406161388 * T + 8.3855555555e-05 * T2 + 4.9994444444e-06 * T3;

        const rMod = Rotations.rotateCart3d(
                     Rotations.rotateCart2d(
                     Rotations.rotateCart3d(osv.position, -zeta), theta), -z);
        const vMod = Rotations.rotateCart3d(
                     Rotations.rotateCart2d(
                     Rotations.rotateCart3d(osv.velocity, -zeta), theta), -z);

        return {frame : Frame.FRAME_MOD,
            position : rMod, velocity : vMod, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from Mean-of-Date (MoD) to the J2000 frame.
     * 
     * The implementation follows Lieske, J.  - Precession matrix based on
     * IAU/1976/ system of astronomical constants, Astronomy and Astrophysics
     * vol. 73, no. 3, Mar 1979, p.282-284.
     * 
     * @param {OsvFrame} osv
     *      OSV in MoD frame.
     * @returns {OsvFrame} OSV in J2000 frame.
     */
    static coordModJ2000(osv : OsvFrame) : OsvFrame
    {
        // Julian centuries after J2000.0 epoch.
        const T = (osv.timeStamp.JTtdb - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;

        const z =      0.6406161388 * T + 3.0407777777e-04 * T2 + 5.0563888888e-06 * T3;
        const theta =  0.5567530277 * T - 1.1851388888e-04 * T2 - 1.1620277777e-05 * T3;
        const zeta =   0.6406161388 * T + 8.3855555555e-05 * T2 + 4.9994444444e-06 * T3;

        const rJ2000 = Rotations.rotateCart3d(
                       Rotations.rotateCart2d(
                       Rotations.rotateCart3d(osv.position, z), -theta), zeta);
        const vJ2000 = Rotations.rotateCart3d(
                       Rotations.rotateCart2d(
                       Rotations.rotateCart3d(osv.velocity, z), -theta), zeta);

        return {frame : Frame.FRAME_J2000, 
            position : rJ2000, velocity : vJ2000, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from Mean-of-Date (MoD) to the True-of-Date (ToD) frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in MoD frame.
     * @param {NutationData} nutData 
     *      Nutation terms object with fields eps, deps and dpsi.
     * @returns {OsvFrame} OSV in ToD frame
     */
    static coordModTod(osv : OsvFrame, nutData : NutationData) : OsvFrame
    {
        // Julian centuries after J2000.0 epoch.
        const T = (osv.timeStamp.JTtdb - 2451545.0) / 36525.0;

        const rTod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.position, nutData.eps), 
                     -nutData.dpsi), 
                     -nutData.eps - nutData.deps);
        const vTod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.velocity, nutData.eps), 
                     -nutData.dpsi),
                     -nutData.eps - nutData.deps);

        return {frame : Frame.FRAME_TOD,
            position : rTod, velocity : vTod, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from True-of-Date (ToD) to the Mean-of-Date (MoD) frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in ToD frame.
     * @param {NutationData} nutData
     *      Nutation terms object with fields eps, deps and dpsi. 
     * @returns {OsvFrame} OSV in MoD frame.
     */
    static coordTodMod(osv : OsvFrame, nutData : NutationData) : OsvFrame
    {
        // Julian centuries after J2000.0 epoch.
        const T = (osv.timeStamp.JTtdb - 2451545.0) / 36525.0;


        const rMod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.position, nutData.eps + nutData.deps), 
                     nutData.dpsi), 
                    -nutData.eps);
        const vMod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.velocity, nutData.eps + nutData.deps), 
                     nutData.dpsi), 
                    -nutData.eps);

        return {frame : Frame.FRAME_MOD,
            position : rMod, velocity : vMod, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from True-of-Date (ToD) to the Pseudo-Earth-Fixed (PEF)
     * frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in ToD frame.
     * @param {NutationData} nutData 
     *      Nutation data.
     * @returns {OsvFrame} OSV in PEF frame.
     */
    static coordTodPef(osv : OsvFrame, nutData : NutationData) : OsvFrame
    {
        const GAST = SiderealTime.timeGast(osv.timeStamp.JTut1, 
            osv.timeStamp.JTtdb, nutData);
        const rPef = Rotations.rotateCart3d(osv.position, GAST);
        const vPef = Rotations.rotateCart3d(osv.position, GAST);

        // Alternative expression for the GMST is \sum_{i=0}^3 k_i MJD^i.
        const k1 = 360.985647366;
        const k2 = 2.90788e-13;
        const k3 = -5.3016e-22;
        const MJD = osv.timeStamp.JTut1 - 2451544.5;
        
        // Compute time-derivative of the GAST to convert velocities:
        const dGASTdt = (1/86400.0) * (k1 + 2*k2*MJD + 3*k3*MJD*MJD);
        vPef[0] += dGASTdt * (Math.PI/180.0) 
                 * (-MathUtils.sind(GAST) * osv.position[0] + MathUtils.cosd(GAST) * osv.position[1]);
        vPef[1] += dGASTdt * (Math.PI/180.0) 
                 * (-MathUtils.cosd(GAST) * osv.position[0] - MathUtils.sind(GAST) * osv.position[1]);

        return {frame : Frame.FRAME_PEF,
            position : rPef, velocity : vPef, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from Pseudo-Earth-Fixed (PEF) to the True-of-Date (ToD) frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in PEF frame.
     * @param {NutationData} nutData 
     *      Nutation data.
     * @returns {OsvFrame} OSV in ToD frame.
     */
    static coordPefTod(osv : OsvFrame, nutData : NutationData) : OsvFrame
    {
        const GAST = SiderealTime.timeGast(osv.timeStamp.JTut1, 
            osv.timeStamp.JTtdb, nutData);
        const rTod = Rotations.rotateCart3d(osv.position, -GAST);

        // Alternative expression for the GMST is \sum_{i=0}^3 k_i MJD^i.
        const k1 = 360.985647366;
        const k2 = 2.90788e-13;
        const k3 = -5.3016e-22;
        const MJD = osv.timeStamp.JTut1 - 2451544.5;
        
        // Compute time-derivative of the GAST to convert velocities:     
        const dGASTdt = (1/86400.0) * (k1 + 2*k2*MJD + 3*k3*MJD*MJD);

        let dRdt_rTod = [0, 0, 0];
        dRdt_rTod[0] = dGASTdt * (Math.PI/180.0) 
                     * (-MathUtils.sind(GAST) * rTod[0] + MathUtils.cosd(GAST) * rTod[1]); 
        dRdt_rTod[1] = dGASTdt * (Math.PI/180.0) 
                     * (-MathUtils.cosd(GAST) * rTod[0] - MathUtils.sind(GAST) * rTod[1]); 

        const vTod = Rotations.rotateCart3d([osv.velocity[0] - dRdt_rTod[0], 
                                osv.velocity[1] - dRdt_rTod[1], 
                                osv.velocity[2]], -GAST);

        return {frame : Frame.FRAME_TOD,
            position : rTod, velocity : vTod, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from PEF to the Earth-Fixed (EFI) frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in PEF frame.
     * @returns {OsvFrame} OSV in EFI frame.
     */
    static coordPefEfi(osv : OsvFrame) : OsvFrame
    {
        const rEfi = Rotations.rotateCart2d(Rotations.rotateCart1d(
            osv.position, -osv.timeStamp.polarDy), -osv.timeStamp.polarDx);
        const vEfi = Rotations.rotateCart2d(Rotations.rotateCart1d(
            osv.velocity, -osv.timeStamp.polarDy), -osv.timeStamp.polarDx);

        return {frame : Frame.FRAME_EFI,
            position : rEfi, velocity : vEfi, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from Earth-Fixed (EFI) to the PEF frame.
     * 
     * @param {OsvFrame} osv
     *     OSV in EFI frame.
     * @returns OSV in PEF frame.
     */
    static coordEfiPef(osv : OsvFrame) : OsvFrame
    {
        const rPef = Rotations.rotateCart1d(Rotations.rotateCart2d(
            osv.position, osv.timeStamp.polarDx), osv.timeStamp.polarDy);
        const vPef = Rotations.rotateCart1d(Rotations.rotateCart2d(
            osv.velocity, osv.timeStamp.polarDx), osv.timeStamp.polarDy);

        return {frame : Frame.FRAME_PEF,
            position : rPef, velocity : vPef, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from EFI to the East-North-Up (ENU) frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in EFI frame.
     * @param {EarthPosition} earthPos
     *      Observer position.
     * @returns {OsvFrame} OSV in ENU frame.
     */
    static coordEfiEnu(osv : OsvFrame, earthPos : EarthPosition) : OsvFrame
    {
        const rObs = Wgs84.coordWgs84Efi(earthPos);
        console.log(earthPos.h);
        const rEnu = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     MathUtils.vecDiff(osv.position, rObs), 90 + earthPos.lon), 
                     90 - earthPos.lat);
        const vEnu = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                    osv.velocity, 90 + earthPos.lon), 90 - earthPos.lat);

        return {frame : Frame.FRAME_ENU,
            position : rEnu, velocity : vEnu, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from ENU to the EFI frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in ENU frame.
     * @param {EarthPosition} earthPos
     *      Observer position.
     * @returns {OsvFrame} OSV in EFI frame.
     */
    static coordEnuEfi(osv : OsvFrame, earthPos : EarthPosition) : OsvFrame
    {
        const rObs = Wgs84.coordWgs84Efi(earthPos);
        const rEnu = MathUtils.vecSum(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.position, earthPos.lat - 90), 
                     -90 - earthPos.lon), rObs);
        const vEnu = Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.velocity, earthPos.lat - 90), 
                     -90 - earthPos.lon);

        return {frame : Frame.FRAME_EFI,
            position : rEnu, velocity : vEnu, timeStamp : osv.timeStamp};
    }

    /**
     * Compute azimuth and elevation from ENU coordinates. The azimuth is
     * measured clockwise from North.
     * 
     * @param {OsvFrame} osv
     *      OSV in ENU frame.
     * @returns {EnuAngles} Azimuth and elevation angles/rates in the ENU frame.
     */
    static coordEnuAzEl(osv : OsvFrame) : EnuAngles
    {
        const rNorm = MathUtils.norm(osv.position);
        const ru = [osv.position[0]/rNorm, osv.position[1]/rNorm, osv.position[2]/rNorm];

        const az = MathUtils.atan2d(ru[0], ru[1]);
        const el = MathUtils.asind(ru[2]);

        // TODO:
        const dazdt = 0;
        const deldt = 0;

        return {az : az, el : el, dazdt : 0, deldt : 0, dist : rNorm};
    }

    /**
     * Compute ENU coordinates from azimuth and elevation. 
     * 
     * @param {EnuAngles} enuAngles
     *      Azimuth and elevation angles/rates in the ENU frame.
     * @param {TimeStamp} timeStamp
     *      Time stamp.
     * @returns {OsvFrame} OSV in the ENU frame.
     */
    static coordAzElEnu(enuAngles : EnuAngles, timeStamp : TimeStamp) : OsvFrame
    {
        const r = [enuAngles.dist * MathUtils.sind(enuAngles.az) * MathUtils.cosd(enuAngles.el), 
                   enuAngles.dist * MathUtils.cosd(enuAngles.az) * MathUtils.cosd(enuAngles.el), 
                   enuAngles.dist * MathUtils.sind(enuAngles.el)];

        // TODO: 
        const v = [0, 0, 0];

        return {frame : Frame.FRAME_ENU, 
            position : r, velocity : v, timeStamp : timeStamp};
    }

    /**
     * Convert coordinates from perifocal to an inertial frame.
     *  
     * Important: The inertial frame is one relative to which the Keplerian 
     * elements are defined. In practice, this can correspond to Ecliptic,
     * J2000, MoD and ToD coordinates.
     * 
     * @param {OsvFrame} osv
     *      OSV in perifocal frame.
     * @param {number} Omega 
     *      The longitude of the ascending node (in degrees).
     * @param {number} incl
     *      The inclination (in degrees).
     * @param {number} omega 
     *      The argument of periapsis (in degrees).
     * @param {Frame} target 
     *      Target inertial frame.
     * @returns OSV in inertial frame.
     */
    static coordPerIne(osv : OsvFrame, Omega : number, incl : number, 
        omega : number, targetFrame : Frame) : OsvFrame
    {
        const rIne = Rotations.rotateCart3d(
                    Rotations.rotateCart1d(
                    Rotations.rotateCart3d(osv.position, -omega), -incl), -Omega);
        const vIne = Rotations.rotateCart3d(
                    Rotations.rotateCart1d(
                    Rotations.rotateCart3d(osv.velocity, -omega), -incl), -Omega);

        return {frame : targetFrame, 
            position : rIne, velocity : vIne, timeStamp : osv.timeStamp};
    }

    /**
     * Convert coordinates from inertial to perifocal frame.
     *  
     * Important: The inertial frame is one relative to which the Keplerian 
     * elements are defined. In practice, this can correspond to Ecliptic,
     * J2000, MoD and ToD coordinates.
     * 
     * @param {OsvFrame} osv
     *      OSV in an inertial frame.
     * @param {number} Omega 
     *      The longitude of the ascending node (in degrees).
     * @param {number} incl
     *      The inclination (in degrees).
     * @param {number} omega 
     *      The argument of periapsis (in degrees).
     * @returns {OsvFrame} OSV in the Perifocal frame.
     */
    static coordInePer(osv : OsvFrame, Omega : number, incl : number, 
        omega : number) : OsvFrame
    {
        const rPer = Rotations.rotateCart3d(
                     Rotations.rotateCart1d(
                     Rotations.rotateCart3d(osv.position, Omega), incl), omega);
        const vPer = Rotations.rotateCart3d(
                     Rotations.rotateCart1d(
                     Rotations.rotateCart3d(osv.velocity, Omega), incl), omega);

        return {frame : Frame.FRAME_PERI,
            position : rPer, velocity : vPer, timeStamp : osv.timeStamp};
    }
}