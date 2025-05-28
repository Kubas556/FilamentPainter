import { getOpacity } from "../tools/AutoOpacity.js";

export interface FilamentData {
	name: string;
	color: string;
	opacity: number;
	layerHeight: number;
}

export const getOpacityFromColor = (hexColor: string) => {
	if (hexColor) {
		const r = parseInt(hexColor.substring(1, 3), 16) / 255;
		const g = parseInt(hexColor.substring(3, 5), 16) / 255;
		const b = parseInt(hexColor.substring(5, 7), 16) / 255;
		return getOpacity(r, g, b);
	}
};
