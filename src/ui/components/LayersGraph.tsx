import React, { SVGProps, useEffect, useRef, useState } from "react";
import { useSyncState } from "../useSyncState";
import { IComponentProjectData } from "../ExportProject";
import { getLayersWithColors, LayerColorData } from "../../tools/HeightmapExport";
import { FilamentData } from "../Filaments";

const segmentGap = 5;
const segmentWidth = 65;

function roundDecimal(num: number) {
    return Math.round(num * 100) / 100;
}

// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
function invertColor(hex: string, bw: boolean) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // https://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
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
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

export function LayersGraph(props: IComponentProjectData) {

    const [computedData] = useSyncState("ComputedData", props.computedData);
    const [exportConfig] = useSyncState("ExportConfig", props.exportConfig);
    const [projectConfig] = useSyncState("ProjectConfig", props.projectConfig);
    const [layers] = useSyncState("FilamentLayers", props.filamentLayers);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const [graphSize, setGraphSize] = useState<{ width: number, height: number }>();
    const [layerRectangles, setLayerRectangles] = useState<SVGProps<SVGRectElement>[]>([]);
    const [filamentMarkers, setFilamentMarkers] = useState<{ x: number, y: number, width: number, height: number, fill: string, text: string, textFill: string }[]>([]);

    useEffect(() => {
        if (computedData?.computedResult && graphSize) {
            const layersWithColors = getLayersWithColors(
                computedData?.computedResult,
                exportConfig.imageResolution.x,
                exportConfig.imageResolution.y,
                projectConfig.baseLayerHeight,
                projectConfig.layerHeight
            ).filter(layer => layer.averageHeight != 0);

            const sorted = layersWithColors.sort((a, b) => b.averageHeight - a.averageHeight);

            const segmentPortion = 100 / layersWithColors.length;
            const segmentHeight = graphSize.height / layersWithColors.length;
            let lastY = 0;

            const layersSegmentHeights = sorted.map<{ svgY: number, layer: LayerColorData }>(layer => {
                const result = { svgY: lastY, layer };
                lastY += segmentPortion;

                return result;
            });

            setLayerRectangles(layersSegmentHeights.map<SVGProps<SVGRectElement>>(layerData => {
                return { y: `calc(${layerData.svgY}% + ${segmentGap / 2}px)`, x: `calc(50% - ${segmentWidth / 2}px)`, width: `${segmentWidth}px`, height: `calc(${segmentPortion}% - ${segmentGap}px)`, fill: layerData.layer.dominantColor.hex };
            }));

            const filamentLayersRange: { min: number, max: number, filament: FilamentData }[] = [];
            const layersCopy = structuredClone(layers);
            layersCopy.reverse();

            for (let i = 0; i < layersCopy.length; i++) {
                if (i == 0) {
                    filamentLayersRange.push({ min: 0, max: roundDecimal(layersCopy[i].layerHeight + projectConfig.baseLayerHeight), filament: layersCopy[i] })
                } else {
                    const prevMax = roundDecimal(filamentLayersRange[filamentLayersRange.length - 1].max);
                    filamentLayersRange.push({ min: prevMax, max: roundDecimal(layersCopy[i].layerHeight + prevMax), filament: layersCopy[i] })
                }
            }

            const markers = filamentLayersRange.map(filamentRange => {
                return {
                    filament: filamentRange.filament,
                    segments: layersSegmentHeights.filter(l => {
                        return l.layer.layerHeightRange.min >= filamentRange.min && l.layer.layerHeightRange.max <= filamentRange.max;
                    })
                }
            }).map(filamentWithSegments => {
                if (filamentWithSegments.segments.length == 0) return;
                const lowestSegment = filamentWithSegments.segments.sort((a, b) => b.svgY - a.svgY)[0]; // highest svg Y value (indexing from top)

                return { x: graphSize.width * 0.15, y: (graphSize.height * (lowestSegment.svgY / 100)) + (segmentHeight / 2), width: 40, height: 25, fill: filamentWithSegments.filament.color, textFill: invertColor(filamentWithSegments.filament.color, true), text: lowestSegment.layer.layerHeightRange.min.toString() };
            });

            setFilamentMarkers(markers.filter(x => x !== undefined));
        }
    }, [computedData, exportConfig, projectConfig])

    useEffect(() => {
        if (svgRef.current) {
            setGraphSize({ width: svgRef.current.scrollWidth, height: svgRef.current.scrollHeight })
        }
    }, [])


    return <div style={{ height: "calc(100% - 2rem)", padding: "1rem" }}>
        <svg width={"100%"} height={"100%"} ref={svgRef}>
            {layerRectangles.map(e => <rect key={`${e.fill}${e.y}`} x={e.x} y={e.y} width={e.width} height={e.height} fill={e.fill} />)}
            {filamentMarkers.map(e => <><polygon key={`${e.fill}${e.y}`} points={`${e.x + ((e.width / 2) - 8)},${e.y + (e.height / 2)} ${e.x - (e.width / 2)},${e.y + (e.height / 2)} ${e.x - (e.width / 2)},${e.y - (e.height / 2)} ${e.x + ((e.width / 2) - 8)},${e.y - (e.height / 2)} ${e.x + (e.width / 2)},${e.y}`} fill={e.fill} /><text key={e.text} x={e.x - (e.width / 2) + 2} y={e.y + 4} fill={e.textFill}>{e.text}</text></>)}
        </svg>
    </div>
}