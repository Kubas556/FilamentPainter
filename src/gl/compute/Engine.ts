import { GLShader } from "../Shader";
import { GLProgram } from "../Program";
import { config } from "../../config/Config";

export class GLComputeEngine {
	vertexShader: GLShader;
	fragmentShader: GLShader;
	program: GLProgram;

	constructor(vertexShader: string, fragmentShader: string) {
		this.vertexShader = new GLShader(config.compute.gl.VERTEX_SHADER, vertexShader);
		this.fragmentShader = new GLShader(config.compute.gl.FRAGMENT_SHADER, fragmentShader);
		this.program = new GLProgram(this.vertexShader, this.fragmentShader);
	}

	dispose() {
		this.vertexShader.dispose();
		this.fragmentShader.dispose();
		this.program.dispose();
	}
}
