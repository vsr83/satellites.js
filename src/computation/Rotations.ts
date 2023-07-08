import {MathUtils} from './MathUtils';

/**
 * Class implementing static methods for rotations.
 */
export class Rotations 
{
    /**
     * Create rotation matrix w.r.t. the first coordinate.
     * 
     * @param {number[]} p 
     *      Vector.
     * @param {number} angle
     *      Angle in degrees. 
     * @returns {number[]} The rotated vector.
     */
    static rotateCart1d(p : number[], angle : number)
    {
        return [p[0], 
                MathUtils.cosd(angle) * p[1] + MathUtils.sind(angle) * p[2],
                -MathUtils.sind(angle) * p[1] + MathUtils.cosd(angle) * p[2]];
    }

    /**
     * Create rotation matrix w.r.t. the second coordinate.
     * 
     * @param {number[]} p 
     *      Vector.
     * @param {number} angle
     *      Angle in degrees. 
     * @returns {number[]} The rotated vector.
     */
    static rotateCart2d(p : number[], angle : number)
    {
        return [MathUtils.cosd(angle) * p[0] - MathUtils.sind(angle) * p[2], 
                p[1],
                MathUtils.sind(angle) * p[0] + MathUtils.cosd(angle) * p[2]];
    }

    /**
     * Create rotation matrix w.r.t. the third coordinate.
     * 
     * @param {number[]} p 
     *      Vector.
     * @param {number} angle
     *      Angle in degrees. 
     * @returns {number[]} The rotated vector.
     */
    static rotateCart3d(p : number[], angle : number)
    {
        return [MathUtils.cosd(angle) * p[0] + MathUtils.sind(angle) * p[1], 
               -MathUtils.sind(angle) * p[0] + MathUtils.cosd(angle) * p[1],
                p[2]];
    }
}