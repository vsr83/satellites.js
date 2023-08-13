import { WebGLUtils } from "./WebGLUtils";

/**
 * Class implementing a line shader for the World map.
 */
export class MapShader2d
{
    private static vertShaderLine : string = `#version 300 es
    
    uniform int u_projectionType;
    #define PROJECTION_EQUIRECTANGULAR 1
    
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    in vec4 a_color;
        
    // a varying to pass the texture coordinates to the fragment shader
    out vec4 v_color;
    
    vec2 coordEquirectangularNorm(in vec2 coordIn)
    {
        return vec2(coordIn.x/180.0, coordIn.y/90.0);
    }

    // all shaders have a main function
    void main() 
    {
        vec2 rNorm = vec2(0.0, 0.0);      
        switch(u_projectionType) {
            case PROJECTION_EQUIRECTANGULAR:
                rNorm = coordEquirectangularNorm(a_position);      
            break;
        }
        gl_Position = vec4(rNorm, 0, 1);
      
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        v_color = a_color;
    }
    `;    

    private static fragShaderLine = `#version 300 es
    precision highp float;

    // the varied color passed from the vertex shader
    in vec4 v_color;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() 
    {
        outColor = v_color;
    }
    `;
    
    // WebGL2 rendering context.
    private contextGl : WebGL2RenderingContext;
    // WebGL program.
    private programLine : WebGLProgram;

    colorAttrLocationLine : number;
    posAttrLocationLine : number;
    vertexArrayLine : WebGLVertexArrayObject;
    positionBufferLine : WebGLBuffer;
    colorBufferLine : WebGLBuffer;
    numLines : number;
    projectionTypeLocation : WebGLUniformLocation;

    private static colorMap : number[] = [127, 127, 127];
    // Earth map polygons.
    private mapPolygons : number[][][];

    constructor()
    {        
    }

    /*
     * Initialize shader.
     *
     * @param {WebGL2RenderingContext} contextGl 
     *      WebGL2 rendering context.
     * @param {string} urlMapJson
     *      URL to the map JSON.
     */
    init(contextGl : WebGL2RenderingContext, urlMapJson : string)
    {
        const gl = contextGl;
        this.contextGl = gl;
        this.programLine = WebGLUtils.compileProgram(gl, MapShader2d.vertShaderLine, MapShader2d.fragShaderLine);

        this.posAttrLocationLine = gl.getAttribLocation(this.programLine, "a_position");
        this.colorAttrLocationLine = gl.getAttribLocation(this.programLine, "a_color");

        // Initialize buffer for map coordinates.
        this.vertexArrayLine = <WebGLVertexArrayObject> gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayLine);

        this.positionBufferLine = <WebGLBuffer> gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferLine);
        gl.enableVertexAttribArray(this.posAttrLocationLine);
        gl.vertexAttribPointer(this.posAttrLocationLine, 2, gl.FLOAT, false, 0, 0);
      
        this.colorBufferLine = <WebGLBuffer> gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferLine);
        gl.enableVertexAttribArray(this.colorAttrLocationLine);
        gl.vertexAttribPointer(this.colorAttrLocationLine, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        this.projectionTypeLocation = <WebGLUniformLocation> gl.getUniformLocation(
            this.programLine, "u_projectionType");

        this.loadMapJson(urlMapJson);
    }

    /**
     * Draw.
     */
    draw()
    {
        const gl = this.contextGl;
        gl.useProgram(this.programLine);
        gl.uniform1i(this.projectionTypeLocation, 1);
        gl.bindVertexArray(this.vertexArrayLine);
        gl.drawArrays(gl.LINES, 0, this.numLines * 2);
    }

    loadMapPolygons()
    {
        const points : number[][] = [];
        let nLines = 0;
        let gl = this.contextGl;

        let gridCoeff = 1.002;

        for (let indPoly = 0; indPoly < this.mapPolygons.length; indPoly++)
        {
            const poly : number[][] = this.mapPolygons[indPoly];

            for (let indPoint = 0; indPoint < poly.length - 1; indPoint++)
            {
                const lonStart = poly[indPoint][0];
                const latStart = poly[indPoint][1];
                const lonEnd   = poly[indPoint + 1][0];
                const latEnd   = poly[indPoint + 1][1];

                points.push([lonStart, latStart]);
                points.push([lonEnd, latEnd]);
                nLines++;
            }
        }

        this.numLines = nLines;
        const positions = new Float32Array(this.numLines * 4);

        for (let indPoint = 0; indPoint < points.length; indPoint++)
        {
            let point = points[indPoint];
            let indStart = indPoint * 2;
            //positions[indStart] = (point[0]+180.0)/360.0;
            //positions[indStart + 1] = 1-(point[1]+90.0)/180.0;
            positions[indStart] = point[0];
            positions[indStart + 1] = point[1];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferLine);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const colorArray = new Uint8Array(this.numLines * 6);

        for (let indPoint = 0; indPoint < this.numLines * 2; indPoint++)
        {
            const startIndex = indPoint * 3;
            colorArray[startIndex] = MapShader2d.colorMap[0];
            colorArray[startIndex + 1] = MapShader2d.colorMap[1];
            colorArray[startIndex + 2] = MapShader2d.colorMap[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferLine);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);    
    }

    /**
     * Load map JSON.
     */
    loadMapJson(url : string)
    {
        let polygons : number[][][] =  [];
        this.mapPolygons = polygons;

        const instance = this;

        var xmlHTTP = new XMLHttpRequest();
        xmlHTTP.onreadystatechange = function()
        {
            console.log("readyState: " + this.readyState);
            console.log("status:     " + this.status);
        
            if (this.readyState == 4 && this.status == 200)
            {
                // Parse JSON and initialize World map.
                let dataJSON = JSON.parse(this.responseText);
                console.log(dataJSON);

                var features = dataJSON.features;
                var numPointsTotal = 0;
        
                for (var index = 0; index < features.length; index++)
                {
                    // Read polygons and multi-polygons.
                    var feature = features[index];
                    var geometry = feature.geometry;
                    
                    if (geometry.type === "Polygon")
                    {
                        const coordinates = geometry.coordinates[0];
                        const numPoints = geometry.coordinates[0].length;
                        polygons.push(coordinates);
                        numPointsTotal += numPoints;
                    }
                    if (geometry.type === "MultiPolygon")
                    {
                        var numPolygons = geometry.coordinates.length;
        
                        for (var indPolygon = 0; indPolygon < numPolygons; indPolygon++)
                        {
                            const coordinates = geometry.coordinates[indPolygon][0];
                            polygons.push(coordinates);
                            numPointsTotal += coordinates.length;
                        }
                    }
                }
                console.log("Added " + numPointsTotal + " points");
                instance.loadMapPolygons();
            }
        }
        xmlHTTP.open("GET", url, true);
        xmlHTTP.send();
    }
}