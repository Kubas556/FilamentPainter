import React, { useEffect, useRef, useState } from "react";
import { useSyncState } from "../useSyncState";
import { IComponentProjectData } from "../ExportProject";
import { getLayersWithColors, LayerColorData } from "../../tools/HeightmapExport";
import { FilamentData } from "../Filaments";
import { Filament } from "../../Filament";

const segmentGap = 5;
const segmentWidth = 65;
const graphTopAndBottomPadding = 15;

function roundDecimal(num: number) {
	return Math.round(num * 100) / 100;
}

/**
 * Linear interpolation between two values
 */
function mix(a: number, b: number, t: number): number {
	return a * (1 - t) + b * t;
}

/**
 * Normalized exponential function that maps [0, 1] to [0, 1] with an exponential curve
 */
function normalizedExponential(x: number): number {
	const exp_neg_2x = Math.exp(-2.0 * x);
	const exp_neg_2 = Math.exp(-2.0); // Precompute e^{-2}
	return (exp_neg_2x - exp_neg_2) / (1.0 - exp_neg_2);
}

/**
 * Interpolates between two RGB colors using an exponential transmission curve
 * @param colourA - First color as [r, g, b] array (values 0-1)
 * @param colourB - Second color as [r, g, b] array (values 0-1)
 * @param t - Interpolation parameter
 * @param opaqueness - Opaqueness factor
 * @returns Interpolated color as [r, g, b] array
 */
export function interpolateColours(
	colourA: [number, number, number],
	colourB: [number, number, number],
	t: number,
	opaqueness: number,
): [number, number, number] {
	let amountInterpolated = t / opaqueness;
	if (amountInterpolated > 1.0) {
		amountInterpolated = 1.0;
	}

	// amountInterpolated in [0, 1]
	// transform to exponential curve
	const transmission = normalizedExponential(amountInterpolated);

	return [
		mix(colourB[0], colourA[0], transmission),
		mix(colourB[1], colourA[1], transmission),
		mix(colourB[2], colourA[2], transmission),
	];
}

// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
function invertColor(hex: string, bw: boolean) {
	if (hex.indexOf("#") === 0) {
		hex = hex.slice(1);
	}
	// convert 3-digit hex to 6-digits.
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	if (hex.length !== 6) {
		throw new Error("Invalid HEX color.");
	}
	var r = parseInt(hex.slice(0, 2), 16),
		g = parseInt(hex.slice(2, 4), 16),
		b = parseInt(hex.slice(4, 6), 16);
	if (bw) {
		// https://stackoverflow.com/a/3943023/112731
		return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#FFFFFF";
	}
	// invert color components
	var textR = (255 - r).toString(16),
		textG = (255 - g).toString(16),
		textB = (255 - b).toString(16);
	// pad each with zeros and return
	return "#" + padZero(textR) + padZero(textG) + padZero(textB);
}

function padZero(str: string, len?: number) {
	len = len || 2;
	var zeros = new Array(len).join("0");
	return (zeros + str).slice(-len);
}

function getLayerBlends(filaments: Filament[], baseLayerHeight: number, layerStepHeight: number): LayerColorData[] {
	let segments: LayerColorData[] = [];
	let prevLayer = null;
	let prevLayerLastColor: [number, number, number] | null = null;
	let layerIndex = 1;
	let prevColor: [number, number, number] = [0, 0, 0];

	for (let i = 0; i < filaments.length; i++) {
		const layer = filaments[i];
		if (prevLayer !== null) {
			let baseMin = prevLayer.endHeight;

			for (let h = baseMin; h < layer.endHeight; h = roundDecimal(h + layerStepHeight)) {
				// Sample color at the END of this layer segment, not the beginning
				const segmentEndHeight = Math.min(baseMin + layerStepHeight, layer.endHeight);
				const color = interpolateColours(
					prevLayerLastColor!, //[prevLayer.colour[0], prevLayer.colour[1], prevLayer.colour[2]], //prevColor,
					[layer.colour[0], layer.colour[1], layer.colour[2]],
					segmentEndHeight - prevLayer.endHeight, //h - prevLayer.endHeight,
					layer.opacity,
				);
				const colorRGB = [Math.round(color[0] * 255), Math.round(color[1] * 255), Math.round(color[2] * 255)];
				const colorHex =
					"#" +
					colorRGB
						.map((c) => c.toString(16).padStart(2, "0"))
						.join("")
						.toUpperCase();

				segments.push({
					dominantColor: { r: colorRGB[0], g: colorRGB[1], b: colorRGB[2], hex: colorHex },
					layerHeightRange: { min: roundDecimal(baseMin), max: roundDecimal(baseMin + layerStepHeight) },
					layerNumber: layerIndex++,
					averageHeight: 1,
					pixelCount: 1,
				});
				baseMin = roundDecimal(baseMin + layerStepHeight);
				prevColor = [color[0], color[1], color[2]];
			}
		} else {
			const colorRGB = [
				Math.round(layer.colour[0] * 255),
				Math.round(layer.colour[1] * 255),
				Math.round(layer.colour[2] * 255),
			];
			const colorHex =
				"#" +
				colorRGB
					.map((c) => c.toString(16).padStart(2, "0"))
					.join("")
					.toUpperCase();
			segments.push({
				dominantColor: { r: colorRGB[0], g: colorRGB[1], b: colorRGB[2], hex: colorHex },
				layerHeightRange: { min: 0, max: roundDecimal(baseLayerHeight) },
				layerNumber: layerIndex++,
				averageHeight: 1,
				pixelCount: 1,
			});
			segments.push({
				dominantColor: { r: colorRGB[0], g: colorRGB[1], b: colorRGB[2], hex: colorHex },
				layerHeightRange: { min: roundDecimal(baseLayerHeight), max: roundDecimal(layer.endHeight) },
				layerNumber: layerIndex++,
				averageHeight: 1,
				pixelCount: 1,
			});
			prevColor = [layer.colour[0], layer.colour[1], layer.colour[2]];
		}

		prevLayer = layer;
		prevLayerLastColor = prevColor;
	}

	return segments;
}

type LayerRectProps = {
	x: number;
	y: number;
	width: number;
	height: number;
	fill: string;
	layerHeightRange: { min: number; max: number };
};
type FilamentMarkerProps = {
	x: number;
	y: number;
	width: number;
	height: number;
	fill: string;
	text: string;
	textFill: string;
};

export function LayersGraph(props: IComponentProjectData) {
	const [computedData] = useSyncState("ComputedData", props.computedData);
	const [exportConfig] = useSyncState("ExportConfig", props.exportConfig);
	const [projectConfig] = useSyncState("ProjectConfig", props.projectConfig);
	const [layers] = useSyncState("FilamentLayers", props.filamentLayers);
	const [, setHoveredLayerRange] = useSyncState("HoveredLayerRange", props.hoveredLayerRange ?? null);

	const svgRef = useRef<SVGSVGElement | null>(null);
	const [graphSize, setGraphSize] = useState<{ width: number; height: number }>();
	const [layerRectangles, setLayerRectangles] = useState<LayerRectProps[]>([]);
	const [filamentMarkers, setFilamentMarkers] = useState<FilamentMarkerProps[]>([]);

	useEffect(() => {
		if (computedData?.computedResult && graphSize) {
			let filaments: FilamentData[] = structuredClone(layers)
				.reverse()
				.filter((x, i) => i == 0 || x.layerHeight >= projectConfig.layerHeight); // filter filaments, which will have zero height after correction

			let layerHeight = projectConfig.baseLayerHeight;
			const usedFilaments: Filament[] = [];
			for (let i = 0; i < filaments.length; i++) {
				usedFilaments.push(
					new Filament(
						filaments[i].color,
						Math.round((filaments[i].layerHeight + layerHeight) * 100) / 100,
						filaments[i].name,
						filaments[i].opacity,
					),
				);
				layerHeight += filaments[i].layerHeight;
			}

			const sorted = getLayerBlends(usedFilaments, projectConfig.baseLayerHeight, projectConfig.layerHeight).sort(
				(a, b) => b.layerHeightRange.max - a.layerHeightRange.max,
			);

			const segmentHeight = (graphSize.height - graphTopAndBottomPadding * 2) / sorted.length;
			let lastY = graphTopAndBottomPadding;

			const layersSegmentHeights = sorted.map<{ svgY: number; layer: LayerColorData }>((layer) => {
				const result = { svgY: lastY, layer };
				lastY += segmentHeight;

				return result;
			});

			setLayerRectangles(
				layersSegmentHeights.map<LayerRectProps>((layerData) => {
					return {
						y: layerData.svgY,
						x: graphSize.width / 2,
						width: segmentWidth,
						height: segmentHeight,
						fill: layerData.layer.dominantColor.hex,
						layerHeightRange: layerData.layer.layerHeightRange,
					};
				}),
			);

			const filamentLayersRange: { min: number; max: number; filament: FilamentData }[] = [];
			const layersCopy = filaments; //structuredClone(layers);

			for (let i = 0; i < layersCopy.length; i++) {
				if (i == 0) {
					filamentLayersRange.push({
						min: 0,
						max: roundDecimal(layersCopy[i].layerHeight + projectConfig.baseLayerHeight),
						filament: layersCopy[i],
					});
				} else {
					const prevMax = roundDecimal(filamentLayersRange[filamentLayersRange.length - 1].max);
					filamentLayersRange.push({
						min: prevMax,
						max: roundDecimal(layersCopy[i].layerHeight + prevMax),
						filament: layersCopy[i],
					});
				}
			}

			const markers = filamentLayersRange
				.map((filamentRange) => {
					return {
						filament: filamentRange.filament,
						segments: layersSegmentHeights.filter((l) => {
							return (
								l.layer.layerHeightRange.min >= filamentRange.min && l.layer.layerHeightRange.max <= filamentRange.max
							);
						}),
					};
				})
				.map<FilamentMarkerProps | undefined>((filamentWithSegments) => {
					if (filamentWithSegments.segments.length == 0) return;
					const lowestSegment = filamentWithSegments.segments.sort((a, b) => b.svgY - a.svgY)[0]; // highest svg Y value (indexing from top)

					return {
						x: graphSize.width * 0.15,
						y: lowestSegment.svgY + segmentHeight,
						width: 40,
						height: 25,
						fill: filamentWithSegments.filament.color,
						textFill: invertColor(filamentWithSegments.filament.color, true),
						text: lowestSegment.layer.layerHeightRange.min.toString(),
					};
				});

			setFilamentMarkers(markers.filter((x) => x !== undefined));
		}
	}, [computedData, exportConfig, projectConfig, graphSize]);

	useEffect(() => {
		var observer: ResizeObserver | null = null;
		if (svgRef.current) {
			observer = new ResizeObserver((entries) => {
				const e = entries[0]; // should be only one
				setGraphSize({ width: e.contentRect.width, height: e.contentRect.height });
			});
			observer.observe(svgRef.current);
		}

		return () => {
			if (observer != null) {
				if (svgRef.current) observer.unobserve(svgRef.current);
				observer.disconnect();
			}
		};
	}, []);

	return (
		<div style={{ height: "calc(100% - 2rem)", padding: "1rem" }}>
			<svg width={"100%"} height={"100%"} ref={svgRef}>
				{layerRectangles.map((e, i, segments) => (
					<>
						<rect
							key={`${e.fill}${e.y}`}
							x={e.x - segmentWidth / 2}
							y={e.y + segmentGap / 2}
							width={e.width}
							height={e.height - segmentGap}
							fill={e.fill}
							style={{ cursor: "pointer" }}
							onMouseEnter={() => setHoveredLayerRange(() => e.layerHeightRange)}
							onMouseLeave={() => setHoveredLayerRange(() => null)}
						/>
						{segments[i].fill == segments[i - 1]?.fill && (
							<line
								style={{ pointerEvents: "none" }}
								key={`same_color_indicator_segment_one_${e.y}`}
								x1={e.x - segmentWidth / 2}
								y1={e.y - e.height + segmentGap / 2}
								x2={e.x + segmentWidth / 2}
								y2={e.y - segmentGap / 2}
								stroke={invertColor(e.fill, true)}
								strokeLinecap="round"
								strokeWidth={2}
							/>
						)}
					</>
				))}
				{graphSize &&
					filamentMarkers.map((e) => (
						<>
							<line
								key={`${e.text}${e.y}`}
								x1={e.x}
								y1={e.y}
								x2={graphSize.width / 2 + segmentWidth / 2 /* always points to the left side of layer segment */}
								y2={e.y}
								stroke={e.fill}
								strokeWidth={1}
							/>
							<polygon
								key={`pol_${e.fill}${e.y}`}
								points={`${e.x + (e.width / 2 - 8)},${e.y + e.height / 2} ${e.x - e.width / 2},${e.y + e.height / 2} ${
									e.x - e.width / 2
								},${e.y - e.height / 2} ${e.x + (e.width / 2 - 8)},${e.y - e.height / 2} ${e.x + e.width / 2},${e.y}`}
								fill={e.fill}
							/>
							<text key={e.text} x={e.x - e.width / 2 + 2} y={e.y + 4} fill={e.textFill}>
								{e.text}
							</text>
						</>
					))}
			</svg>
		</div>
	);
}
