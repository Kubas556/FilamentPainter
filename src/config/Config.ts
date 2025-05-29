import { ComputeConfig } from "./Compute";
import { ExportConfig } from "./Export";
import { PaintConfig } from "./Paint";

export class Config {
	private _compute: ComputeConfig = new ComputeConfig();
	private _export: ExportConfig = new ExportConfig();
	private _paint: PaintConfig = new PaintConfig();

	public get compute(): ComputeConfig {
		return this._compute;
	}

	public get export(): ExportConfig {
		return this._export;
	}

	public get paint(): PaintConfig {
		return this._paint;
	}
}

export const config: Config = new Config();
