import { OsvFrame } from "../computation/Frames";
import { MathUtils } from "../computation/MathUtils";
import { WebGLUtils } from "./WebGLUtils";

export class PlanetShader2d
{
    private static vertShaderPlanet : string = `#version 300 es
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

    // WebGL2 rendering context.
    private contextGl : WebGL2RenderingContext;
    // WebGL program.
    private programPlanet : WebGLProgram;

    // Position attribute location.
    private posAttrLocation : number;
    // Texture attribute location.
    private texAttrLocation : number;
    // Vertex array for the planet.
    private vertexArrayPlanet : WebGLVertexArrayObject;

    // Number of textures already loaded.
    private numTextures : number;


    /**
     * Public constructor.
     */
    constructor()
    {
    }

    /**
      * Initialize shaders, buffers and textures.
      * 
      * @param {WebGL2RenderingContext} contextGl 
      *      WebGL2 rendering context.
      * @param {string} srcTextureDay
      *      URL of the texture for the iluminated part of the sphere. 
      * @param {string} srcTextureNight 
      *      URL of the texture for the non-iluminated part of the sphere.
      */
    init(contextGl : WebGL2RenderingContext, pathTextureDay : string, pathTextureNight : string) : void
    {
        this.numTextures = 0;
        this.contextGl = contextGl;
        const gl = this.contextGl;
        this.programPlanet = WebGLUtils.compileProgram(this.contextGl, PlanetShader2d.vertShaderPlanet, PlanetShader2d.fragShaderPlanet);

        // Get attribute and uniform locations.
        this.posAttrLocation = gl.getAttribLocation(this.programPlanet, "a_position");
        this.texAttrLocation = gl.getAttribLocation(this.programPlanet, "a_texcoord");

        this.vertexArrayPlanet = <WebGLVertexArrayObject> gl.createVertexArray();
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

        // Load Texture and vertex coordinate buffers. 
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
        
        // Load textures:
        const imageDay = new Image();
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
        });
    }    

    /**
     * Load texture.
     * 
     * @param {Number} index 
     *      Texture index.
     * @param {Image} image 
     *      The image to be loaded.
     * @param {WebGLUniformLocation} imageLocation 
     *      Uniform location for the texture.
     */
    loadTexture(index : number, image : any, imageLocation : WebGLUniformLocation)
    {
        // Create a texture.
        const gl = this.contextGl;
        gl.useProgram(this.programPlanet);

        const texture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(imageLocation, index);

        this.numTextures++;
    }

    draw(osvEfiSun : OsvFrame)
    {
        if (this.numTextures < 2)
        {
            return;
        }
        const gl = this.contextGl;

        gl.useProgram(this.programPlanet);

        const sunXLocation = gl.getUniformLocation(this.programPlanet, "u_sun_x");
        const sunYLocation = gl.getUniformLocation(this.programPlanet, "u_sun_y");
        const sunZLocation = gl.getUniformLocation(this.programPlanet, "u_sun_z");
        const grayscaleLocation = gl.getUniformLocation(this.programPlanet, "u_grayscale");
        const brightnessLocation = gl.getUniformLocation(this.programPlanet, "u_texture_brightness");
        const drawTextureLocation = gl.getUniformLocation(this.programPlanet, "u_draw_texture");

        const rECEFSun = osvEfiSun.position;//[-140456614121.2753,-3050172162.1580505,58265567310.35503];
        gl.uniform1f(drawTextureLocation, 1);
        gl.uniform1f(grayscaleLocation, 0);
        gl.uniform1f(sunXLocation, rECEFSun[0] / MathUtils.norm(rECEFSun));
        gl.uniform1f(sunYLocation, rECEFSun[1] / MathUtils.norm(rECEFSun));
        gl.uniform1f(sunZLocation, rECEFSun[2] / MathUtils.norm(rECEFSun));
        gl.uniform1f(brightnessLocation, 0.6);

        var resolutionLocation = gl.getUniformLocation(this.programPlanet, "u_resolution");
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(this.vertexArrayPlanet);
        gl.drawArrays(gl.TRIANGLES, 0, 6);    
    }
}