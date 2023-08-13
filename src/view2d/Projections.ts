export enum ProjectionType {
    EQUIRECTANGULAR = 1,
}

/**
 * Class implementing map projections and the mappings between the map coordinates
 * and the canvas. The projections also have to be implemented in the shaders.
 */
export class Projection {
    // Projection type.
    projectionType : ProjectionType;

    // HTML element for 2d canvas.
    private canvasJs : HTMLCanvasElement;

    // All coordinate transformations involve transformations between the
    // following four coordinates systems. For equirectangular coordinates, 
    // The conversion between 3 and 4 is always an identity mapping.
    // 1. Canvas coordinates:
    // x : [0, canvasJs.width]
    // y : [0, canvasJs.height], where 0 corresponds to top.
    // 2. Normalized coordinates used by WebGL.
    // x' : [-1, 1], where x = 0 -> x' = -1
    // y' : [-1, 1], where y = 0 -> y' = 1
    // 3. Equirectangular coordinates
    // x'': [-180, 180] (longitude)
    // y'': [-90, 90] (latitude)
    // 4. Selected coordinates

    // The motivation here is to keep the coordinate changes trackable and
    // easily translated into the shader code. For shaders, the only difference 
    // to the JS canvas is that the transformations are between the systems 2-4.

    /**
     * Public constructor.
     * 
     * @param {HTMLCanvasElement} canvasJs
     *      Javascript canvas used for drawing of lines. 
     */
    constructor(canvasJs : HTMLCanvasElement) {
        this.projectionType = ProjectionType.EQUIRECTANGULAR;
        this.canvasJs = canvasJs;
    }

    /**
     * Set the projection type.
     * 
     * @param {ProjectionType} projectionType
     *      The projection type. 
     */
    setProjectionType(projectionType : ProjectionType) {
        this.projectionType = projectionType;
    }

    /**
     * Convert canvas coordinates to normalized coordinates.
     * 
     * @param {number[]} rCanvas 
     *      Canvas coordinates.
     * @returns {number[]} Normalized coordinates.
     */
    coordCanvasNorm(rCanvas : number[]) : number[] {
        return [-1.0 + 2.0 * rCanvas[0] / this.canvasJs.width,
                 1.0 - 2.0 * rCanvas[1] / this.canvasJs.height];
    }

    /**
     * Convert from normalized to canvas coordinates.
     * 
     * @param {number[]} rNorm 
     *      Normalized coordinates.
     * @returns {number[]} Canvas coordinates.
     */
    coordNormCanvas(rNorm : number[]) : number[] {
        return [this.canvasJs.width  * (1.0 + rNorm[0]) / 2.0,
                this.canvasJs.height * (1.0 - rNorm[1]) / 2.0];
    }

    /**
     * Convert normalized to equirectangular coordinates.
     * 
     * @param {number[]} rNorm
     *      Normalized coordinates. 
     * @returns {number[]} Equirectangular coordinates. 
     */
    coordNormEquirectangular(rNorm : number[]) : number[] {
        return [180.0 * rNorm[0], 90.0 * rNorm[1]];
    }

    /**
     * Convert from equirectangular to normalized coordinates.
     * 
     * @param {number[]} rEqu 
     *      Equirectangular coordinates.
     * @returns {number[]} Normalized coordinates.
     */
    coordEquirectangularNorm(rEqu : number[]) : number[] {
        return [rEqu[0] / 180.0, rEqu[1] / 90.0];
    }

    /**
     * Convert from equirectangular to target coordinates.
     * 
     * @param {number[]} rEqu
     *      Equirectangular coordinates. 
     * @returns {number[]} Target coordinates.
     */
    coordEquirectangularTarget(rEqu : number[]) : number[] {
        switch (this.projectionType) {
            case ProjectionType.EQUIRECTANGULAR:
                return rEqu;
                break;
        }
    }

    /**
     * Convert from equirectangular to target coordinates.
     * 
     * @param {number[]} rTarget
     *      Target coordinates. 
     * @returns {number[]} Equirectangular coordinates.
     */
    coordTargetEquirectangular(rTarget : number[]) : number[] {
        switch (this.projectionType) {
            case ProjectionType.EQUIRECTANGULAR:
                return rTarget;
                break;
        }
    }

    /**
     * Convert from canvas to target coordinates.
     * 
     * @param {number[]} rCanvas 
     *      Canvas coordinates.
     * @returns {number[]} Target coordinates.
     */
    coordCanvasTarget(rCanvas : number[]) : number[] {
        return this.coordEquirectangularTarget(
            this.coordNormEquirectangular(
            this.coordCanvasNorm(rCanvas)));
    }

    /**
     * Convert from target to canvas coordinates.
     * 
     * @param {number[]} rTarget
     *      Target coordinates.
     * @returns {number[]} Canvas coordinates.
     */
    coordTargetCanvas(rTarget : number[]) : number[] {
        return this.coordNormCanvas(
            this.coordEquirectangularNorm(
            this.coordTargetEquirectangular(rTarget)));
    }
}