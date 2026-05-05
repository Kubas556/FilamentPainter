import { config } from "../../config/Config";
import { GLShader } from "../Shader";
import { GLProgram } from "../Program";

const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    vec2 uv = (a_position + 1.0) * 0.5;
    v_texCoord = vec2(uv.x, 1.0 - uv.y);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D computedTexture;
uniform float highlightMin;
uniform float highlightMax;
uniform float highlightProgress;

in vec2 v_texCoord;
out vec4 fragColor;

void main() {
    vec4 computed = texture(computedTexture, v_texCoord);
    
    vec3 color = computed.rgb;
    float height = computed.a;
    
    if (height > highlightMin && height <= highlightMax && highlightProgress > 0.0) {
        vec3 inverted = vec3(1.0) - color;
        color = mix(color, inverted, highlightProgress);
    }
    
    fragColor = vec4(color, 1.0);
}
`;

export class GLDisplayEngine {
    private vertexShader: GLShader;
    private fragmentShader: GLShader;
    private program: GLProgram;
    private positionBuffer: WebGLBuffer | null = null;
    private vao: WebGLVertexArrayObject | null = null;

    constructor() {
        this.vertexShader = new GLShader(config.compute.gl.VERTEX_SHADER, vertexShaderSource);
        this.fragmentShader = new GLShader(config.compute.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = new GLProgram(this.vertexShader, this.fragmentShader);
        this.setupBuffers();
    }

    private setupBuffers() {
        const gl = config.compute.gl;
        
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.program.program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindVertexArray(null);
    }

    render(
        computedTexture: WebGLTexture,
        width: number,
        height: number,
        highlightRange: { min: number; max: number } | null,
        highlightProgress: number
    ): void {
        const gl = config.compute.gl;
        
        gl.useProgram(this.program.program);
        gl.bindVertexArray(this.vao);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, computedTexture);
        
        const textureLocation = gl.getUniformLocation(this.program.program, "computedTexture");
        gl.uniform1i(textureLocation, 0);
        
        const minLocation = gl.getUniformLocation(this.program.program, "highlightMin");
        const maxLocation = gl.getUniformLocation(this.program.program, "highlightMax");
        const progressLocation = gl.getUniformLocation(this.program.program, "highlightProgress");
        
        gl.uniform1f(minLocation, highlightRange?.min ?? -1000);
        gl.uniform1f(maxLocation, highlightRange?.max ?? -1000);
        gl.uniform1f(progressLocation, highlightProgress);
        
        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    dispose() {
        const gl = config.compute.gl;
        if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
        if (this.vao) gl.deleteVertexArray(this.vao);
        this.vertexShader.dispose();
        this.fragmentShader.dispose();
        this.program.dispose();
    }
}

let displayEngine: GLDisplayEngine | null = null;

export function getDisplayEngine(): GLDisplayEngine {
    if (!displayEngine) {
        displayEngine = new GLDisplayEngine();
    }
    return displayEngine;
}
