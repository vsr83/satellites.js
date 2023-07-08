import vsop87AData from '../../data/vsop87a.json';
import {MathUtils} from './MathUtils';
import {Frame, OsvFrame} from './Frames';
import {TimeStamp} from './TimeCorrelation';

/**
 * Static methods implementing VSOP87A for the computation of the locations of 
 * planets and the approximate barycenter.
 */
export class Vsop87A 
{
    /**
     * Compute position and velocity of a planet with VSOP87A in the J2000 frame.
     * Important: The frame is heliocentric centered in the barycenter of the Sun.
     * Frame fixed to the barycenter of the solar system is different.
     * 
     * @param {string} targetName
     *      Name of the target planet (mercury, venus, earth, mars, jupiter, saturn,
     *      neptune).
     * @param {TimeStamp} timeStamp 
     *      Timestamp.
     * @returns {OsvFrame} OSV in the heliocentric ecliptic frame.
     */
    static planetHeliocentric(targetName : string, timeStamp : TimeStamp) : OsvFrame
    {
        // Avoid TS7053 error.
        interface IStringIndex {
            [key: string]: any
        }
        const data : IStringIndex = vsop87AData;
        const json = data[targetName];

        let pos : number[] = [0, 0, 0];
        let vel : number[] = [0, 0, 0];
        const t : number = (timeStamp.JTtdb - 2451545.0) / 365250;

        for (let indDim = 0; indDim < 3; indDim++)
        {
            for (let indPower = 0; indPower < 6; indPower++)
            {
                const coeffs : number[][] = json[indDim][indPower];
                const tPower : number = Math.pow(t, indPower);

                for (let indCoeff = 0; indCoeff < coeffs.length; indCoeff++)
                {
                    const coeff0 : number = coeffs[indCoeff][0];
                    const coeff1 : number = coeffs[indCoeff][1];
                    const coeff2 : number = coeffs[indCoeff][2];

                    pos[indDim] += tPower * coeff0 * Math.cos(coeff1 + coeff2 * t);
                    vel[indDim] -= tPower * coeff0 * coeff2 * Math.sin(coeff1 + coeff2 * t);
                }
            }
        }

        // Convert units from au and au/s to m and m/s.
        const auMeters : number = 149597870700;
        // [v] = au / (1000 * year) = 149597870700 m / (365250 * 86400 s) = 4.740470463533349 m/s
        const vFactor : number = 4.740470463533349;

        return {frame : Frame.FRAME_ECLHEL,
            position : MathUtils.vecMul(pos, auMeters), 
            velocity: MathUtils.vecMul(vel, vFactor), 
            timeStamp : timeStamp
        };
    }

    /**
     * Compute position of the barycenter of the solar system in a frame fixed to the Sun.
     * Note that this does not contain the contribution from comets, meteors, moons or 
     * satellites.
     * 
     * @param {TimeStamp} timeStamp
     *     Timestamp.
     * @returns {OsvFrame} The location of the Barycenter.
     */
    static planetBarycentric(timeStamp : TimeStamp) : OsvFrame
    {
        const massList = [3.285e23, 4.867e24, 5.972e24, 6.39e23, 1.898e27, 5.683e26, 8.681e25, 1.024e26];
        const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

        let massTotal = 1.989e30;
        let r = [0, 0, 0];
        let v = [0, 0, 0];

        for (let indPlanet = 0; indPlanet < planets.length; indPlanet++)
        {
            const massPlanet = massList[indPlanet];
            massTotal += massPlanet;
            const osvPlanet = this.planetHeliocentric(planets[indPlanet], timeStamp);
            r = MathUtils.vecSum(r, MathUtils.vecMul(osvPlanet.position, massPlanet));
            v = MathUtils.vecSum(v, MathUtils.vecMul(osvPlanet.velocity, massPlanet));
        }

        return {
            frame : Frame.FRAME_ECLHEL,
            position : MathUtils.vecMul(r, 1.0 / massTotal), 
            velocity : MathUtils.vecMul(v, 1.0 / massTotal),
            timeStamp : timeStamp
        };
    }
}