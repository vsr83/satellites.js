import {MathUtils} from "./MathUtils";

/**
 * Interface for observer position on Earth.
 */
export interface EarthPosition
{
    lat : number;
    lon : number;
    h : number;
}

/**
 * Class implementing static methods for the handling of the WGS84 ellipsoid.
 */
export class Wgs84
{
    /**
     * Compute the latitude, longitude and height in the WGS84 system from EFI
     * position.
     * 
     * @param {number[]} r 
     *      The position in EFI (in meters).
     * @param {number} maxIter 
     *      The maximum number of iterations (default 5)
     * @param {number} maxErr 
     *      The maximum relative error in meters (default 1e-10)
     * @param {number} verbose 
     *      Display convergence information to console.
     * @returns {EarthPosition} Object with fields lat, lon, h for latitude 
     *      (degrees), longitude (degrees) and height above the ellipsoid 
     *      (meters).
     */
    static coordEfiWgs84(r : number[], maxIter : number, maxErr : number, 
        verbose : boolean) : EarthPosition
    {
        if (verbose === undefined)
        {
            verbose = false;
        }
        if (maxIter === undefined)
        {
            maxIter = 5;
        }
        if (maxErr === undefined)
        {
            maxErr = 1e-10;
        }

        // Semi-major axis:
        const a = 6378137;
        // Semi-major axis:
        const b = 6356752.314245;
        // Eccentricity sqrt(1 - (b*b)/(a*a))
        const ecc = 0.081819190842966;
        const ecc2 = ecc*ecc;
        
        // Longitude (B.4)
        const lon = MathUtils.atan2d(r[1], r[0]);
        // Initial value for latitude (B.5)
        const p = Math.sqrt(r[0]*r[0] + r[1]*r[1]);
        let lat = MathUtils.atand((r[2] / p) / (1.0 - ecc2)); 
        let h = 0;

        for (let iter = 0; iter < maxIter; iter++)
        {
            // Iteration (B.6)
            const N = a/Math.sqrt(1 - Math.pow(ecc * MathUtils.sind(lat), 2));
            h = p/MathUtils.cosd(lat) - N;
            lat = MathUtils.atand((r[2]/p)/(1 - ecc2*(N/(N + h))));

            const rIter = this.coordWgs84Efi({lat : lat, lon : lon, h : h});
            const err = MathUtils.norm(MathUtils.vecDiff(rIter, r)) / MathUtils.norm(r);

            if (verbose)
            {
                console.log("iter " + iter + " lat " + lat + " error " + err);
            }

            if (err < maxErr)
            { 
                break;
            }
        }

        return {lat : lat, lon : lon, h : h};
    }

    /**
     * Convert the latitude, longitude and height in the WGS84 system to the EFI
     * position.
     * 
     * @param {EarthPosition} earthPos
     *      The position of the observer.
     * @returns {number[]} Position in EFI frame.
     */
    static coordWgs84Efi(earthPos : EarthPosition) : number[]
    {
        // Semi-major axis:
        const a = 6378137;
        //  Eccentricity sqrt(1 - (b*b)/(a*a))
        const ecc = 0.081819190842966;
        const ecc2 = ecc*ecc;
        
        const N = a/Math.sqrt(1 - Math.pow(ecc*MathUtils.sind(earthPos.lat), 2));
        const r = [(N + earthPos.h) * MathUtils.cosd(earthPos.lat)*MathUtils.cosd(earthPos.lon),
                   (N + earthPos.h) * MathUtils.cosd(earthPos.lat)*MathUtils.sind(earthPos.lon),
                  ((1 - ecc2)* N + earthPos.h) * MathUtils.sind(earthPos.lat)];

        return r;
    }
}