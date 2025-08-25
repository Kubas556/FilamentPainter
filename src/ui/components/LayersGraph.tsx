import React, { useEffect, useRef, useState } from "react";
import { useSyncState } from "../useSyncState";
import { IComponentProjectData } from "../ExportProject";
import { getLayersWithColors, LayerColorData } from "../../tools/HeightmapExport";
import { FilamentData } from "../Filaments";

const segmentGap = 5;
const segmentWidth = 65;
const graphTopAndBottomPadding = 15;

function roundDecimal(num: number) {
	return Math.round(num * 100) / 100;
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

type LayerRectProps = { x: number; y: number; width: number; height: number; fill: string };
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

	const svgRef = useRef<SVGSVGElement | null>(null);
	const [graphSize, setGraphSize] = useState<{ width: number; height: number }>();
	const [layerRectangles, setLayerRectangles] = useState<LayerRectProps[]>([]);
	const [filamentMarkers, setFilamentMarkers] = useState<FilamentMarkerProps[]>([]);

	useEffect(() => {
		if (computedData?.computedResult && graphSize) {
			const layersWithColors = getLayersWithColors(
				computedData?.computedResult,
				exportConfig.imageResolution.x,
				exportConfig.imageResolution.y,
				projectConfig.baseLayerHeight,
				projectConfig.layerHeight,
			); //.filter((layer) => layer.averageHeight != 0);

			const sorted = layersWithColors.sort((a, b) => b.layerHeightRange.max - a.layerHeightRange.max);

			const segmentHeight = (graphSize.height - graphTopAndBottomPadding * 2) / layersWithColors.length;
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
					};
				}),
			);

			const filamentLayersRange: { min: number; max: number; filament: FilamentData }[] = [];
			const layersCopy = structuredClone(layers);
			layersCopy.reverse();

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
				{layerRectangles.map((e) => (
					<rect
						key={`${e.fill}${e.y}`}
						x={e.x - segmentWidth / 2}
						y={e.y + segmentGap / 2}
						width={e.width}
						height={e.height - segmentGap}
						fill={e.fill}
					/>
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
								key={`${e.fill}${e.y}`}
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
