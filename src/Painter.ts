import { config } from "./config/Config";
import { handleImageUpload } from "./Upload";
import { getComputeFunction, GLComputeHeights } from "./gl/compute/Heights";
import { GLImage } from "./gl/Image";
import { debugDisplayDataOutput, debugDisplayHTMLImage } from "./debug/DisplayImage";
import { getFilamentListElements, setupDragAndDrop } from "./ui/Filaments";
import { setupHeightSelector } from "./ui/Heights";
import { HeightFunction } from "./config/Paint";
import { generateLargeHeightmap, generateSTLAndDownload, getHeights } from "./tools/HeightmapExport";
import { setupPreviewWindow } from "./ui/PreviewWindow";
import { initGL } from "./gl/Init";
import { autoUpdateImage, updateImage, updateOtherField } from "./ui/UpdateImage";
import { setupExport } from "./ui/Export";
import { setupExportProject } from "./ui/ExportProject";
import { GoldenLayout } from "golden-layout";
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";

initGL();

// config.paint.image = new Image();
//
// config.paint.image.onload = () => {
//     let comp = getComputeFunction(HeightFunction.NEAREST);
//
//     let image = new GLImage(config.paint.image);
//
//     let result = comp.compute(image);
//
//     debugDisplayDataOutput(result, image.width, image.height);
//     debugDisplayHTMLImage(config.paint.image);
//
//
//     setupHeightSelector(() => {
//         let comp = getComputeFunction(config.paint.heightFunction);
//         let result = comp.compute(image);
//         debugDisplayDataOutput(result, image.width, image.height);
//         debugDisplayHTMLImage(config.paint.image);
//
//         // let heights = getHeights(result, image.width, image.height);
//         // console.log(heights);
//         //
//         // generateSTLAndDownload(heights);
//
//         // downloadSTL(stlString, `large_heightmap_scaled.stl`);
//     });
// }
var layers = document.getElementById("layers-section") as HTMLElement;
var sidebar = document.querySelector(".config-sidebar") as HTMLElement;
var canvasSource = document.querySelector("#canvas-source") as HTMLElement;
var canvasPreview = document.querySelector("#canvas-preview") as HTMLElement;
var f = new GoldenLayout(document.querySelector(".container") as HTMLDivElement);
f.loadLayout({
	header: { popout: "" },
	dimensions: { borderWidth: 1 },
	root: { type: "column", content: [] },
});
f.registerComponentFactoryFunction("layers", (container, state, virtual) => {
	container.element.appendChild(layers);
});
f.registerComponentFactoryFunction("sidebar", (container, state, virtual) => {
	container.element.appendChild(sidebar);
});
f.registerComponentFactoryFunction("source", (container, state, virtual) => {
	const element = document.createElement("div");
	element.appendChild(canvasSource);
	element.style.display = "flex";
	element.style.flexDirection = "row";
	element.style.height = "100%";
	container.element.appendChild(element);
});
f.registerComponentFactoryFunction("preview", (container, state, virtual) => {
	const element = document.createElement("div");
	element.appendChild(canvasPreview);
	element.style.display = "flex";
	element.style.flexDirection = "row";
	element.style.height = "100%";
	container.element.appendChild(element);
});
const location = f.addItem({
	type: "row",
	content: [
		{ type: "component", size: "15%", componentType: "sidebar" },
		{ type: "component", size: "15%", componentType: "layers" },
		{
			type: "column",
			content: [
				{ type: "component", componentType: "preview" },
				{ type: "component", componentType: "source" },
			],
		},
	],
});

const imageResolutionX = document.getElementById("image-resolution-x") as HTMLInputElement;
const imageResolutionY = document.getElementById("image-resolution-y") as HTMLInputElement;
const physicalXInput = document.getElementById("physical-x") as HTMLInputElement;

handleImageUpload("image-upload", (result) => {
	if (result.error) {
		console.error("Image upload error:", result.error);
	} else if (result.imageElement) {
		config.paint.image = result.imageElement;
		config.paint.sourceImage = result.imageElement;

		imageResolutionX.value = `${config.paint.image.width}`;
		imageResolutionY.value = `${config.paint.image.height}`;
		physicalXInput.value = "100";
		updateOtherField(physicalXInput);

		updateImage();
	}
});

setupPreviewWindow();
setupHeightSelector();

const baseLayerHeight = document.getElementById("base-layer-height-input") as HTMLInputElement;
const endLayerHeight = document.getElementById("end-layer-height-label") as HTMLElement;

baseLayerHeight.addEventListener("input", () => {
	const filaments = getFilamentListElements();
	let height = parseFloat(baseLayerHeight.value);
	for (let i = 0; i < filaments.length; i++) {
		height += filaments[i].layerHeight;
	}
	endLayerHeight.innerHTML = `End Height: ${height.toString()} mm`;
});

document.addEventListener("DOMContentLoaded", () => {
	setupDragAndDrop((list: HTMLUListElement) => {
		const filaments = getFilamentListElements();
		let height = parseFloat(baseLayerHeight.value);
		for (let i = 0; i < filaments.length; i++) {
			height += filaments[i].layerHeight;
		}
		height = Math.round(height * 100) / 100;
		endLayerHeight.innerHTML = `End Height: ${height.toString()} mm`;

		autoUpdateImage();
	});
});

setupExport();
setupExportProject();

document.getElementById("buy-commercial")?.addEventListener("click", () => {
	window.open("https://ko-fi.com/s/1d20470ee2", "_blank");
});
