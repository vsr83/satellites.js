/**
 * This class implements static methods for standard mathematical trigonometric
 * and vector operations.
 */
export class MathUtils
{
    /**
     * Convert degrees to radians.
     * 
     * @param {number} deg 
     *      Value in degrees.
     * @returns {number} The value in radians not limited to any interval
     *      such as [0, 2*PI]. 
     */
    static deg2Rad(deg : number)
    {
        return 2.0 * Math.PI * deg / 360.0;
    }

    /**
     * Convert radians to degrees.
     * 
     * @param {number} rad 
     *      Value in radians.
     * @returns {number} The value in degrees not limited to any interval 
     *      such as [0, 360].
     */
    static rad2Deg(rad : number)
    {
        return 180.0 * rad / (Math.PI);
    }

    /**
     * Compute sin of argument in degrees.
     * 
     * @param {number} angle 
     *      The argument in degrees.
     * @returns {number} The value.
     */
    static sind(angle : number)
    {
        return Math.sin(angle * Math.PI / 180.0);
    }

    /**
     * Compute cos of argument in degrees.
     * 
     * @param {number} angle 
     *      The argument in degrees.
     * @returns {number} The value.
     */
    static cosd(angle : number)
    {
        return Math.cos(angle * Math.PI / 180.0);
    }
    
    /**
     * Compute tan in degrees.
     * 
     * @param {number} deg 
     *      In degrees.
     * @returns {number} The value.
     */
    static tand(deg : number)
    {
        return Math.tan(this.deg2Rad(deg));
    }

    /**
     * Compute arcsin in degrees.
     * 
     * @param {number} val 
     *      The value.
     * @returns {number} The angle in degrees in the range [-90, 90].
     */
    static asind(val : number)
    {
        return this.rad2Deg(Math.asin(val));
    }

    /**
     * Compute arccos in degrees.
     * 
     * @param {number} val 
     *      The value.
     * @returns {number} The angle in degrees in the range [0, 180].
     */
    static acosd(val : number)
    {
        return this.rad2Deg(Math.acos(val));
    }

    /**
     * Compute arctan in degrees.
     * 
     * @param {number} val 
     *      The value.
     * @returns {number} The angle in degrees.
     */
    static atand(val : number)
    {
        return this.rad2Deg(Math.atan(val));
    }

    /**
     * Compute atan2
     * 
     * @param {number} y 
     *      The y value.
     * @param {number} x
     *      The x value.
     * @returns {number} The angle in degrees in the range (-180, 180].
     */
    static atan2d(y : number, x : number)
    {
        return this.rad2Deg(Math.atan2(y, x));
    }

    /**
     * Compute cross product of two 3d vectors.
     * 
     * @param {number[]} u
     *      The first 3d vector. 
     * @param {number[]} v 
     *      The second 3d vector.
     * @returns {number[]} The cross product.
     */
    static cross(u : number[], v : number[])
    {
        return [u[1]*v[2] - u[2]*v[1], 
                u[2]*v[0] - u[0]*v[2], 
                u[0]*v[1] - u[1]*v[0]];
    }

    /**
     * Compute dot product between two vectors.
     * 
     * @param {number[]} u 
     *      The first 3d vector.
     * @param {number[]} v 
     *      The second 3d vector.
     * @returns {number} The dot product.
     */
    static dot(u : number[], v : number[]) 
    {
        return u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
    }

    /**
     * Compute norm with a vector.
     * 
     * @param {number[]} u 
     *      The 3d vector.
     * @returns {number} The norm.
     */
    static norm(u : number[])
    {
        return Math.sqrt(u[0]*u[0] + u[1]*u[1] + u[2]*u[2]);
    }

    /**
     * Compute sum of two 3d vectors.
     * 
     * @param {number[]} u 
     *      The first vector.
     * @param {number[]} v
     *      The second vector.
     * @returns {number[]} The sum.
     */
    static vecSum(u : number[], v : number[])
    {
        return [u[0]+v[0], u[1]+v[1], u[2]+v[2]];
    }

    /**
     * Compute linear combination of vectors.
     * 
     * @param {number[]} k
     *      Array of coefficients. 
     * @param {number[][]} x 
     *      Array of vectors.
     * @returns {number[]} The linear combination.
     */
    static linComb(k : number[], x : number[][])
    {
        const dim = x[0].length;
        let y : number[] = new Array<number>(dim).fill(0);

        for (let indTerm = 0; indTerm < k.length; indTerm++)
        {
            const xTerm = x[indTerm];
            for (let indElem = 0; indElem < dim; indElem++)
            {
                y[indElem] += k[indTerm] * xTerm[indElem];
            }
        }

        return y;
    }

    /**
     * Compute difference of two 3d vectors.
     * 
     * @param {*} u 
     *      The first vector.
     * @param {*} v
     *      The second vector.
     * @returns {number[]} The difference.
     */
    static vecDiff(u : number[], v : number[])
    {
        return [u[0]-v[0], u[1]-v[1], u[2]-v[2]];
    }

    /**
     * Multiply vector with a scalar.
     * 
     * @param {number[]} u 
     *      The vector.
     * @param {number} s
     *      The scalar.
     * @returns {number[]} The result.
     */
    static vecMul(u : number[], s : number)
    {
        return [u[0]*s, u[1]*s, u[2]*s];
    }
}