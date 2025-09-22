import { afterEach, beforeAll, expect, test } from "vitest";

type Color = [number, number, number];
type LABColor = [number, number, number];
type XYZColor = [number, number, number];
type HeightRange = [number, number, number]; // [min, max, step]

function findNearestHeight(
	colour: Color,
	colours: Color[],
	heights: number[],
	opacities: number[],
	heightRange: HeightRange,
	numIndices: number,
): number {
	// Helper functions (based on the GLSL implementations above)

	function srgbToLinear(srgb: Color): Color {
		return srgb.map((c) => {
			if (c <= 0.04045) {
				return c / 12.92;
			} else {
				return Math.pow((c + 0.055) / 1.055, 2.4);
			}
		}) as Color;
	}

	function linearToXyz(linearRGB: Color): XYZColor {
		// RGB to XYZ transformation matrix
		const rgb2xyz: number[][] = [
			[0.4124564, 0.3575761, 0.1804375],
			[0.2126729, 0.7151522, 0.072175],
			[0.0193339, 0.119192, 0.9503041],
		];

		return [
			rgb2xyz[0][0] * linearRGB[0] + rgb2xyz[0][1] * linearRGB[1] + rgb2xyz[0][2] * linearRGB[2],
			rgb2xyz[1][0] * linearRGB[0] + rgb2xyz[1][1] * linearRGB[1] + rgb2xyz[1][2] * linearRGB[2],
			rgb2xyz[2][0] * linearRGB[0] + rgb2xyz[2][1] * linearRGB[1] + rgb2xyz[2][2] * linearRGB[2],
		];
	}

	function xyzToLab(xyz: XYZColor): LABColor {
		// Reference white (D65)
		const white: XYZColor = [0.95047, 1.0, 1.08883];
		const ratio: number[] = xyz.map((v, i) => v / white[i]);

		const v: number[] = ratio.map((r) => {
			if (r > 0.008856) {
				return Math.pow(r, 1.0 / 3.0);
			} else {
				return 7.787 * r + 16.0 / 116.0;
			}
		});

		const L: number = 116.0 * v[1] - 16.0;
		const a: number = 500.0 * (v[0] - v[1]);
		const b: number = 200.0 * (v[1] - v[2]);

		return [L, a, b];
	}

	function srgbToLab(srgb: Color): LABColor {
		const linearRGB: Color = srgbToLinear(srgb);
		const xyz: XYZColor = linearToXyz(linearRGB);
		return xyzToLab(xyz);
	}

	function normalizedExponential(x: number): number {
		const exp_neg_2x: number = Math.exp(-2.0 * x);
		const exp_neg_2: number = Math.exp(-2.0);
		return (exp_neg_2x - exp_neg_2) / (1.0 - exp_neg_2);
	}

	function interpolateColours(colourA: Color, colourB: Color, t: number, opaqueness: number): Color {
		let amountInterpolated: number = t / opaqueness;
		if (amountInterpolated > 1.0) {
			amountInterpolated = 1.0;
		}

		// Transform to exponential curve
		const transmission: number = normalizedExponential(amountInterpolated);

		// Mix the colors (equivalent to GLSL mix)
		return [
			colourB[0] * (1 - transmission) + colourA[0] * transmission,
			colourB[1] * (1 - transmission) + colourA[1] * transmission,
			colourB[2] * (1 - transmission) + colourA[2] * transmission,
		];
	}

	function distance(vec1: LABColor, vec2: LABColor): number {
		const dx: number = vec1[0] - vec2[0];
		const dy: number = vec1[1] - vec2[1];
		const dz: number = vec1[2] - vec2[2];
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	// Main algorithm
	let currentColour: Color = [...colours[0]];
	let previousColour: Color = [...colours[0]];
	let previousHeight: number = heightRange[0];
	let currentHeight: number = heightRange[0];
	let index: number = 0;

	let nearestHeight: number = 0;
	let nearestColourDistance: number = 100000.0;

	// Convert input color to CIE LAB colour space
	const colourLab: LABColor = srgbToLab(colour);

	for (let i = 0; i < 2000; i++) {
		currentHeight += heightRange[2];

		if (currentHeight < heights[0] - 0.000001) {
			const currentColourLab: LABColor = srgbToLab(currentColour);
			if (distance(currentColourLab, colourLab) <= nearestColourDistance) {
				nearestHeight = currentHeight;
				nearestColourDistance = distance(currentColourLab, colourLab);
			}
			continue;
		}

		if (currentHeight > heightRange[1]) {
			break;
		}

		if (currentHeight < heights[index] - 0.000001) {
			if (index === 0) {
				continue;
			}
		} else {
			index++;
			previousColour = [...currentColour];
			previousHeight = currentHeight;

			if (index >= numIndices) {
				break;
			}
		}

		currentColour = interpolateColours(
			previousColour,
			colours[index],
			currentHeight - previousHeight,
			opacities[index],
		);
		const currentColourLab: LABColor = srgbToLab(currentColour);
		if (distance(currentColourLab, colourLab) <= nearestColourDistance) {
			nearestHeight = currentHeight;
			nearestColourDistance = distance(currentColourLab, colourLab);
		}
	}

	return nearestHeight;
}

test("findNearestHeight", () => {
	const colour: Color = [1.0, 1.0, 1.0];
	const colours: Color[] = [
		[0.0, 0.0, 0.0],
		[1.0, 1.0, 1.0],
	];
	const heights: number[] = [0.28, 0.36000000000000004];
	const opacities: number[] = [0.13, 1];
	const heightRange: HeightRange = [0.2, 0.36000000000000004, 0.08];
	const numIndices: number = heights.length;
	const nearestHeight = findNearestHeight(colour, colours, heights, opacities, heightRange, numIndices);
	expect(nearestHeight).toBe(0.36);
});
