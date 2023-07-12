export class WebGLUtils 
{
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
    static compileProgram(gl : WebGL2RenderingContext, vertexShaderSource : string, 
        fragmentShaderSource : string)
    {
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