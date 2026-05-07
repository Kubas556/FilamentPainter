import React, { useContext, useEffect, useRef, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { getComputeFunction } from "../../gl/compute/Heights";
import { getDisplayEngine } from "../../gl/compute/Display";
import { GLImage } from "../../gl/Image";
import { FilamentData } from "../Filaments";
import { Filament } from "../../Filament";
import { getTopographyFunction, resizePaintImage } from "../UpdateImage";
import { IComponentProjectData } from "../ExportProject";
import { IHoveredLayerRange, useSyncState } from "../useSyncState";
import { config } from "../../config/Config";

const CROSSFADE_DURATION_MS = 150;

export function ImagePreview(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	const [sourceImage] = useSyncState("SourceImage", props.sourceImage);
	const [exportConfig] = useSyncState("ExportConfig", props.exportConfig);
	const [projectConfig] = useSyncState("ProjectConfig", props.projectConfig);
	const [filamentLayers] = useSyncState("FilamentLayers", props.filamentLayers);
	const [computedData, setComputedData] = useSyncState("ComputedData", props.computedData);
	const [hoveredLayerRange] = useSyncState("HoveredLayerRange", props.hoveredLayerRange ?? null);

	const [glImage, setGlImage] = useState<GLImage | undefined>();
	const [ratio, setRatio] = useState<number | null>(null);

	const imageRef = useRef<HTMLCanvasElement>(null);
	const manipulationCanvasRef = useRef<HTMLCanvasElement>(null);
	
	const animationFrameRef = useRef<number | null>(null);
	const currentHoverRef = useRef<IHoveredLayerRange | null>(null);
	const computedTextureRef = useRef<WebGLTexture | null>(null);
	const textureSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

	const renderWithShader = (progress: number, hoverRange: IHoveredLayerRange | null) => {
		if (!computedTextureRef.current || textureSizeRef.current.width === 0 || !imageRef.current) return;
		
		const displayEngine = getDisplayEngine();
		const gl = config.compute.gl;
		const computeCanvas = config.compute.canvas;
		
		computeCanvas.width = textureSizeRef.current.width;
		computeCanvas.height = textureSizeRef.current.height;
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		displayEngine.render(
			computedTextureRef.current,
			textureSizeRef.current.width,
			textureSizeRef.current.height,
			hoverRange,
			progress
		);
		
		const canvas = imageRef.current;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(computeCanvas, 0, 0);
		}
	};

	useEffect(() => {
		if (!computedTextureRef.current) return;
		
		const startTime = performance.now();
		const previousHover = currentHoverRef.current;
		
		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
		}
		
		const isFadingIn = hoveredLayerRange !== null;
		
		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			let progress = Math.min(elapsed / CROSSFADE_DURATION_MS, 1);
			
			if (!isFadingIn) {
				progress = 1 - progress;
			}
			
			const activeHover = isFadingIn ? hoveredLayerRange : previousHover;
			renderWithShader(progress, activeHover);
			
			if ((isFadingIn && progress < 1) || (!isFadingIn && progress > 0)) {
				animationFrameRef.current = requestAnimationFrame(animate);
			} else {
				animationFrameRef.current = null;
				currentHoverRef.current = hoveredLayerRange;
			}
		};
		
		animationFrameRef.current = requestAnimationFrame(animate);
		
		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [hoveredLayerRange]);

	useEffect(() => {
		if (manipulationCanvasRef.current === null) {
			manipulationCanvasRef.current = document.createElement("canvas") as HTMLCanvasElement;
		}

		if (imageRef.current && sourceImage && exportConfig && projectConfig) {
			resizePaintImage(manipulationCanvasRef.current, sourceImage, exportConfig, (resizedImage) => {
				const resized = resizedImage;

				let heightFunction = getTopographyFunction(projectConfig.selectedTopographyFunction);

				let computeEngine = getComputeFunction(heightFunction);

				if (glImage !== undefined) {
					setGlImage((prev) => {
						if (prev) {
							prev.dispose();
							return undefined;
						}
					});
				}

				const canvas = imageRef.current as HTMLCanvasElement;
				const ctx = canvas.getContext("2d");
				const newGlImage = new GLImage(resized);

				canvas.width = resized.width;
				canvas.height = resized.height;
				setRatio(resized.width / resized.height);

				let filaments: FilamentData[] = structuredClone(filamentLayers).reverse();
				let layerHeight = projectConfig.baseLayerHeight;
				const usedFilaments: Filament[] = [];
				for (let i = 0; i < filaments.length; i++) {
					usedFilaments.push(
						new Filament(
							filaments[i].color,
							filaments[i].layerHeight + layerHeight,
							filaments[i].name,
							filaments[i].opacity,
						),
					);
					layerHeight += filaments[i].layerHeight;
				}

				const startHeight = projectConfig.baseLayerHeight;
				const endHeight = layerHeight;
				const increment = projectConfig.layerHeight;

				const computeResult = computeEngine.compute(newGlImage, {
					filaments: usedFilaments,
					startHeight,
					endHeight,
					increment,
				});

				if (computedTextureRef.current) {
					config.compute.gl.deleteTexture(computedTextureRef.current);
				}
				computedTextureRef.current = computeResult.texture;
				textureSizeRef.current = { width: computeResult.width, height: computeResult.height };

				setComputedData((prev) => ({ 
					computedResult: computeResult.data, 
					computedTexture: computeResult.texture,
					textureWidth: computeResult.width,
					textureHeight: computeResult.height,
					filaments: usedFilaments 
				}));

				if (!ctx) {
					throw new Error("Canvas 2D context not available.");
				}

				setGlImage(newGlImage);

				const imageData = ctx.createImageData(resized.width, resized.height);
				const data = imageData.data;

				data.set(computeResult.data.map((val, i) => (i % 4 === 3 ? 255 : val * 255)));
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.putImageData(imageData, 0, 0);
			});
		}
	}, [imageRef.current, sourceImage, exportConfig, projectConfig, filamentLayers]);

	return (
		<div className="preview-container-observer">
			<style>
				{ratio !== null &&
					`
				@container canvas (max-aspect-ratio: ${ratio}) {
					.preview-canvas-container {
						flex-direction: column;
					}
				}
			`}
			</style>
			<div className="preview-canvas-container">
				<canvas id="canvas-preview" className="preview-canvas" ref={imageRef} />
			</div>
		</div>
	);
}
