import { IVisibility } from "../IVisibility";
import { MathUtils } from "../computation/MathUtils";
import { JulianTime } from "../computation/JulianTime";
import { TimeCorrelation, TimeStamp, TimeConvention } from "../computation/TimeCorrelation";
import { Vsop87A } from "../computation/Vsop87A";
import { Frame, Frames, OsvFrame} from "../computation/Frames";
import { Nutation, NutationData } from "../computation/Nutation";
import { TimeView } from "../TimeView";
import { Dataset } from "../Dataset";
import { PropagatedOsvData, Propagation } from "../Propagation";
import { EarthPosition, Wgs84 } from "../computation/Wgs84";
import { PlanetShader2d } from "./PlanetShader2d";

/**
 * Class implementing the 2d view.
 */
export class View2d implements IVisibility
{
    private timeView : TimeView;
    private dataset : Dataset;
    private propagation : Propagation;

    // HTML element for 2d canvas.
    private canvas2d : HTMLCanvasElement;
    // HTML element for the WebGL2 canvas.
    private canvasGl : HTMLCanvasElement;
    // HTML element for the container.
    private container : HTMLElement;

    private timeCorr : TimeCorrelation;

    planetShader : PlanetShader2d;

    /*private static vertShaderPlanet : string = `#version 300 es
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    in vec2 a_texcoord;
    
    // A matrix to transform the positions by
    uniform mat4 u_matrix;
    uniform vec2 u_resolution;
    
    // a varying to pass the texture coordinates to the fragment shader
    out vec2 v_texcoord;
    
    // all shaders have a main function
    void main() 
    {
        // convert from 0->1 to 0->2
        vec2 zeroToTwo = a_position * 2.0;
      
        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;
      
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        v_texcoord = a_texcoord;        
    }
    `;

    private static fragShaderPlanet : string = `#version 300 es       
    precision highp float;
    #define PI 3.1415926538
    
    // Passed in from the vertex shader.
    in vec2 v_texcoord;
    
    // The texture.
    uniform sampler2D u_imageDay;
    uniform sampler2D u_imageNight;
    
    // Flags for drawing of the textures and the eclipses.
    uniform bool u_draw_texture;
    uniform bool u_grayscale;
    uniform float u_texture_brightness;

    // ECEF coordinates for the Moon and the Sun. The Sun vector has been scaled
    // to have length of 1 to avoid issues with the arithmetic.
    uniform float u_moon_x;
    uniform float u_moon_y;
    uniform float u_moon_z;
    uniform float u_sun_x;
    uniform float u_sun_y;
    uniform float u_sun_z;

    // Angular diameter of the Sun. It seems tha the shader arithmetic is not
    // accurate enough to compute this.
    uniform float u_sun_diam;

    // we need to declare an output for the fragment shader
    out vec4 outColor;
    
    float deg2rad(in float deg)
    {
        return 2.0 * PI * deg / 360.0; 
    }

    float rad2deg(in float rad)
    {
        return 360.0 * rad / (2.0 * PI);
    }

    float cosd(in float deg)
    {
        return cos(deg2rad(deg));
    }

    float sind(in float deg)
    {
        return sin(deg2rad(deg));
    }

    highp vec3 coordWgs84Efi(in highp float lat, in highp float lon, in highp float h)
    {
        // Semi-major axis:
        highp float a = 6378137.0;
        //  Eccentricity sqrt(1 - (b*b)/(a*a))
        highp float ecc = 0.081819190842966;
        highp float ecc2 = ecc*ecc;
        
        highp float N = a / sqrt(1.0 - pow(ecc * sind(lat), 2.0));
        highp vec3 r = vec3((N + h) * cosd(lat)*cosd(lon),
                      (N + h) * cosd(lat)*sind(lon),
                      ((1.0 - ecc2) * N + h) * sind(lat));
        return r;
    }

    highp vec3 rotateCart1d(in highp vec3 p, in highp float angle)
    {
        return vec3(p.x, 
                    cosd(angle) * p.y + sind(angle) * p.z,
                   -sind(angle) * p.y + cosd(angle) * p.z);
    }
    
    highp vec3 rotateCart3d(in highp vec3 p, in highp float angle)
    {
        return vec3(cosd(angle) * p.x + sind(angle) * p.y, 
                   -sind(angle) * p.x + cosd(angle) * p.y,
                    p.z);
    }
    
    highp vec3 coordEfiEnu(in highp vec3 pos, highp float lat, highp float lon, highp float h, bool transl)
    {
        highp vec3 rObs = coordWgs84Efi(lat, lon, h);

        if (transl)
        {
            highp vec3 rDiff = pos - rObs;
            highp vec3 rEnu2 = rotateCart3d(rDiff, 90.0 + lon);
            highp vec3 rEnu = rotateCart1d(rEnu2, 90.0 - lat);

            return rEnu;
        }
        else 
        {
            highp vec3 rEnu2 = rotateCart3d(pos, 90.0 + lon);
            highp vec3 rEnu = rotateCart1d(rEnu2, 90.0 - lat);

            return rEnu;
        }
    }
    vec4 toGrayscale(in vec4 rgb)
    {
        float g =  0.3 * rgb.x + 0.59 * rgb.y + 0.11 * rgb.z;
        vec4 outC;
        outC = vec4(g, g, g, rgb.w);
        return outC;
    }
    
    void main() 
    {
        vec3 coordECEFSun = vec3(u_sun_x, u_sun_y, u_sun_z);
        vec3 coordECEFMoon = vec3(u_moon_x, u_moon_y, u_moon_z);

        float lon = 2.0 * PI * (v_texcoord.x - 0.5);
        float lat = PI * (0.5 - v_texcoord.y);
        float longitude = rad2deg(lon);
        float latitude  = rad2deg(lat);

        // Surface coordinates.
        vec3 obsECEF = coordWgs84Efi(latitude, longitude, 0.0);
        vec3 coordSunENU = coordEfiEnu(coordECEFSun, latitude, longitude, 0.0, false);
        float altitude = rad2deg(asin(coordSunENU.z / length(coordSunENU)));

        if (u_draw_texture)
        {    
            if (altitude > 0.0)
            {
                // Day. 
                outColor = u_texture_brightness * texture(u_imageDay, v_texcoord);
            }
            else if (altitude > -6.0)
            {
                // Civil twilight.
                outColor = mix(texture(u_imageNight, v_texcoord), u_texture_brightness * texture(u_imageDay, v_texcoord), 0.5);
            }
            else if (altitude > -12.0)
            {
                // Nautical twilight.
                outColor = mix(texture(u_imageNight, v_texcoord), u_texture_brightness * texture(u_imageDay, v_texcoord), 0.25);
            }
            else if (altitude > -18.0)
            {
                // Astronomical twilight.
                outColor = mix(texture(u_imageNight, v_texcoord), u_texture_brightness * texture(u_imageDay, v_texcoord), 0.125);
            }
            else
            {
                // Night.
                outColor = texture(u_imageNight, v_texcoord);
            }
        }

        if (u_grayscale)
        {
            outColor = toGrayscale(outColor);
        }
    }
    `;
*/
    private static vertShaderLine : string = `#version 300 es
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    in vec4 a_color;
        
    // a varying to pass the texture coordinates to the fragment shader
    out vec4 v_color;
    
    // all shaders have a main function
    void main() 
    {
        // convert from 0->1 to 0->2
        vec2 zeroToTwo = a_position * 2.0;
      
        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;
      
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
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

    // HTML 2d canvas rendering context.
    context2d : CanvasRenderingContext2D;
    // WebGL2 rendering context.
    contextGl : WebGL2RenderingContext;
    // WebGL program.
    //programPlanet : WebGLProgram;
    // WebGL program.
    programMap : WebGLProgram;

    positionBufferMap : WebGLBuffer;
    colorBufferMap : WebGLBuffer;
    numLinesMap : number;

    //posAttrLocation : number;
    //texAttrLocation : number;
    colorAttrLocationMap : number;
    posAttrLocationMap : number;

    //matrixLocation : WebGLUniformLocation;
    //vertexArrayPlanet : WebGLVertexArrayObject;
    vertexArrayMap : WebGLVertexArrayObject;
    //numTextures : number;

    // Earth map polygons.
    private mapPolygons : number[][][];
    private static colorMap : number[] = [127, 127, 127];

    /**
     * Public constructor.
     * 
     * @param {TimeView} timeView
     *      Time view.
     */
    constructor(dataset : Dataset, 
        propagation : Propagation, 
        timeView : TimeView)
    {
        this.timeCorr = new TimeCorrelation();
        this.timeView = timeView;
        this.dataset = dataset;
        this.propagation = propagation;
        this.planetShader = new PlanetShader2d();
    }

    /**
     * Set view DOM elements.
     * 
     * @param {HTMLElement} container 
     *      HTML element for the contained element.
     * @param {string} canvas2d 
     *      HTML element for the 2d canvas.
     * @param {string} canvasGl 
     *      HTML element for the WebGL canvas.
     */
    setElements(
        container : string,
        canvas2d : string,
        canvasGl : string)
    {
        function getElement(id : string) : HTMLElement
        {
            const elem : HTMLElement | null = document.getElementById(id);
            if (elem === null)
            {
                throw Error("Element \"" + id + "\" not found!");
            }

            return elem;
        }

        try
        {
            this.container = <HTMLElement> getElement(container);
            this.canvas2d = <HTMLCanvasElement> getElement(canvas2d);
            this.canvasGl = <HTMLCanvasElement> getElement(canvasGl);
        }
        catch (E : any)
        {
            throw E;
        }

        this.context2d = <CanvasRenderingContext2D> this.canvas2d.getContext("2d");
        this.contextGl = <WebGL2RenderingContext> this.canvasGl.getContext("webgl2");
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

    /**
     * Initialize shaders, buffers and textures.
     * 
     * @param {string} srcTextureDay
     *      URL of the texture for the iluminated part of the sphere. 
     * @param {string} srcTextureNight 
     *      URL of the texture for the non-iluminated part of the sphere.
     */
    init(pathTextureDay : string, pathTextureNight : string) : void
    {
        const gl = this.contextGl;
        //this.programPlanet = this.compileProgram(View2d.vertShaderPlanet, View2d.fragShaderPlanet);
        this.programMap = this.compileProgram(View2d.vertShaderLine, View2d.fragShaderLine);

        // Get attribute and uniform locations.
        //this.posAttrLocation = gl.getAttribLocation(this.programPlanet, "a_position");
        //this.texAttrLocation = gl.getAttribLocation(this.programPlanet, "a_texcoord");
        //this.matrixLocation = <WebGLUniformLocation> gl.getUniformLocation(this.programPlanet, "u_matrix");
        this.planetShader.init(this.contextGl, pathTextureDay, pathTextureNight);

        this.posAttrLocationMap = gl.getAttribLocation(this.programMap, "a_position");
        this.colorAttrLocationMap = gl.getAttribLocation(this.programMap, "a_color");

        /*this.vertexArrayPlanet = <WebGLVertexArrayObject> gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayPlanet);
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.posAttrLocation);
        gl.vertexAttribPointer(this.posAttrLocation, 2, gl.FLOAT, false, 0, 0);
        */

       // Load Texture and vertex coordinate buffers. 
       /*
        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.texAttrLocation);
        gl.vertexAttribPointer(this.texAttrLocation, 2, gl.FLOAT, false, 0, 0);
        */
        
        // Initialize buffer for map coordinates.
        this.vertexArrayMap = <WebGLVertexArrayObject> gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayMap);

        this.positionBufferMap = <WebGLBuffer> gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferMap);
        gl.enableVertexAttribArray(this.posAttrLocationMap);
        gl.vertexAttribPointer(this.posAttrLocationMap, 2, gl.FLOAT, false, 0, 0);
      
        this.colorBufferMap = <WebGLBuffer> gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferMap);
        gl.enableVertexAttribArray(this.colorAttrLocationMap);
        gl.vertexAttribPointer(this.colorAttrLocationMap, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        
        // Load textures:
        /*const imageDay = new Image();
        imageDay.src = pathTextureDay;
        const imageLocationDay = <WebGLUniformLocation> gl.getUniformLocation(this.programPlanet, "u_imageDay");
        
        const imageNight = new Image();
        imageNight.src = pathTextureNight;
        const imageLocationNight = <WebGLUniformLocation> gl.getUniformLocation(this.programPlanet, "u_imageNight");
        
        this.numTextures = 0;
        let instance = this;
        imageDay.addEventListener('load', function() {
            instance.loadTexture(0, imageDay, imageLocationDay);
        });
        imageNight.addEventListener('load', function() {
            instance.loadTexture(1, imageNight, imageLocationNight);
        });*/
    }

    draw()
    {
        function lonToX(lon : number, canvasJs : HTMLCanvasElement) : number
        {
            return canvasJs.width * ((lon + 180.0) / 360.0);
        }
        
        function latToY(lat : number, canvasJs : HTMLCanvasElement) : number
        {
            return canvasJs.height * ((-lat + 90.0) / 180.0);
        }
        
        function xToLon(x : number, canvasJs  : HTMLCanvasElement) : number
        {
            return (360.0 * (x - canvasJs.width / 2)) / canvasJs.width;
        }
        
        function yToLat(y : number, canvasJs : HTMLCanvasElement) : number
        {
            return -(180.0 * (y - canvasJs.height / 2)) / canvasJs.height;
        }

        const JT = this.timeView.update();

        /*if (this.numTextures < 2)
        {
            if (this.isVisible())
            {
                requestAnimationFrame(this.draw.bind(this));
            }
        }*/
        if (this.isVisible())
        {
            requestAnimationFrame(this.draw.bind(this));
        }

        const dateNow = new Date();
        const timeStamp : TimeStamp = this.timeCorr.computeTimeStamp(JT, TimeConvention.TIME_UTC, true);
        const nutData : NutationData = Nutation.iau1980(timeStamp);

        const osvHelEarth : OsvFrame = Vsop87A.planetHeliocentric("earth", timeStamp);
        const osvEclHel : OsvFrame = {frame : Frame.FRAME_ECLHEL, timeStamp : timeStamp, 
        position : [0, 0, 0], velocity : [0, 0, 0]};
        const osvEclGeo = Frames.coordHelEcl(osvEclHel, osvHelEarth);
        const osvJ2000 = Frames.coordEclEq(osvEclGeo);
        const osvMoD = Frames.coordJ2000Mod(osvJ2000);
        const osvToD = Frames.coordModTod(osvMoD, nutData);
        const osvPef = Frames.coordTodPef(osvToD, nutData);
        const osvEfi = Frames.coordPefEfi(osvPef);

        const propData : PropagatedOsvData = this.propagation.propagateAll(JT);
        //console.log(osvEfi);

        const gl = this.contextGl;
        //gl.useProgram(this.programPlanet);

        this.canvasGl.width = window.innerWidth; //document.documentElement.clientWidth;
        this.canvasGl.height = window.innerHeight;// document.documentElement.clientHeight;
        this.canvas2d.width = window.innerWidth;//document.documentElement.clientWidth;
        this.canvas2d.height = window.innerHeight;//document.documentElement.clientHeight;
        console.log(this.canvasGl.width + " " + this.canvasGl.height);
        
        /*const moonXLocation = gl.getUniformLocation(this.programPlanet, "u_moon_x");
        const moonYLocation = gl.getUniformLocation(this.programPlanet, "u_moon_y");
        const moonZLocation = gl.getUniformLocation(this.programPlanet, "u_moon_z");
        const sunXLocation = gl.getUniformLocation(this.programPlanet, "u_sun_x");
        const sunYLocation = gl.getUniformLocation(this.programPlanet, "u_sun_y");
        const sunZLocation = gl.getUniformLocation(this.programPlanet, "u_sun_z");
        const sunDiamLocation = gl.getUniformLocation(this.programPlanet, "u_sun_diam");
        const grayscaleLocation = gl.getUniformLocation(this.programPlanet, "u_grayscale");
        const brightnessLocation = gl.getUniformLocation(this.programPlanet, "u_texture_brightness");
        const drawTextureLocation = gl.getUniformLocation(this.programPlanet, "u_draw_texture");

        const rECEFSun = osvEfi.position;//[-140456614121.2753,-3050172162.1580505,58265567310.35503];
        gl.uniform1f(drawTextureLocation, 1);
        gl.uniform1f(grayscaleLocation, 0);
        const diamAngSun = 2 * MathUtils.atand(696340000.0 / MathUtils.norm(rECEFSun));
        gl.uniform1f(sunXLocation, rECEFSun[0] / MathUtils.norm(rECEFSun));
        gl.uniform1f(sunYLocation, rECEFSun[1] / MathUtils.norm(rECEFSun));
        gl.uniform1f(sunZLocation, rECEFSun[2] / MathUtils.norm(rECEFSun));
        gl.uniform1f(sunDiamLocation, diamAngSun);
        gl.uniform1f(brightnessLocation, 0.6);

        var resolutionLocation = gl.getUniformLocation(this.programPlanet, "u_resolution");
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        */
    
        /*gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(this.vertexArrayPlanet);
        gl.drawArrays(gl.TRIANGLES, 0, 6);    

        gl.useProgram(this.programMap);
        gl.bindVertexArray(this.vertexArrayMap);
        gl.drawArrays(gl.LINES, 0, this.numLinesMap * 2);
        */

        this.planetShader.draw(osvEfi);

        const targetNames : string[] = Object.keys(propData);
        for (let indTarget = 0; indTarget < targetNames.length; indTarget++)
        {
            const targetName : string = targetNames[indTarget];

            const osvEfi : OsvFrame = propData[targetName];
            const pos : EarthPosition = Wgs84.coordEfiWgs84(osvEfi.position, 10, 1e-10, false);

            // Draw Sun location.
            const x = lonToX(pos.lon, this.canvas2d);
            const y = latToY(pos.lat, this.canvas2d);
            this.context2d.beginPath();
            this.context2d.arc(x, y, 2, 0, Math.PI * 2);
            this.context2d.fillStyle = "#ffff00";
            this.context2d.fill();

            this.context2d.fillStyle = "rgba(255, 255, 255)";

            this.context2d.textAlign = "center";
            this.context2d.textBaseline = "bottom";
            this.context2d.textAlign = "right";
            this.context2d.strokeStyle = this.context2d.fillStyle;

            const caption : string = targetName;

            this.context2d.fillText(caption, x, y); 

        }
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

        this.numLinesMap = nLines;
        const positions = new Float32Array(this.numLinesMap * 4);

        for (let indPoint = 0; indPoint < points.length; indPoint++)
        {
            let point = points[indPoint];
            let indStart = indPoint * 2;
            positions[indStart] = (point[0]+180.0)/360.0;
            positions[indStart + 1] = 1-(point[1]+90.0)/180.0;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferMap);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const colorArray = new Uint8Array(this.numLinesMap * 6);

        for (let indPoint = 0; indPoint < this.numLinesMap * 2; indPoint++)
        {
            const startIndex = indPoint * 3;
            colorArray[startIndex] = View2d.colorMap[0];
            colorArray[startIndex + 1] = View2d.colorMap[1];
            colorArray[startIndex + 2] = View2d.colorMap[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferMap);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);    
    }        

    /**
     * Show the view.
     */
    show() : void
    {
        this.container.style.visibility = "visible";
        requestAnimationFrame(this.draw.bind(this));
    }

    /**
     * Hide the view.
     */
    hide() : void 
    {
        this.container.style.visibility = "hidden";
    }

    /**
     * Whether the view is visible.
     * 
     * @returns {boolean} Visibility.
     */
    isVisible(): boolean 
    {
        return (this.container.style.visibility === "visible");
    }

    /**
     * Compile the WebGL program.
     * 
     * @param {WebGLRenderingContext} gl
     *      The WebGL rendering context to use.
     * @param {string} vertexShaderSource
     *       Source of the vertex shader.
     * @param {string} fragmentShaderSource
     *       Source of the fragment shader.
     * @returns The compiled program.
     */
    compileProgram(vertexShaderSource : string, fragmentShaderSource : string)
    {
        const gl : WebGL2RenderingContext = this.contextGl;

        const vertexShader : WebGLShader | null = gl.createShader(gl.VERTEX_SHADER);
        if (vertexShader === null)
        {
            throw Error("Failed to create vertex shader!");
        }
        
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        {
            throw Error("Failed to compile vertex shader!");
        }

        const fragmentShader : WebGLShader | null = gl.createShader(gl.FRAGMENT_SHADER);
        if (fragmentShader === null)
        {
            throw Error("Failed to create fragment shader!");
        }

        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        {
            throw Error("Failed to compile fragment shader!");
        }

        const program : WebGLProgram | null = gl.createProgram();
        if (program === null)
        {
            throw Error("Failed to create WebGLProgram!");
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
        {
            gl.deleteProgram(program);
            throw Error("Failed to link WebGLProgram!");
        }

        return program;
    }
}