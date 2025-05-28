import { HeightFunction } from "../config/Paint";
import { IExportConfig } from "./EventHub";

export function getTopographyFunction(selectedValue?: string) {
	let selectedHeightFunction: HeightFunction;

	switch (selectedValue) {
		case "nearest":
			selectedHeightFunction = HeightFunction.NEAREST;
			break;
		case "greyscale-max":
			selectedHeightFunction = HeightFunction.GREYSCALE_MAX;
			break;
		case "greyscale-luminance":
			selectedHeightFunction = HeightFunction.GREYSCALE_LUMINANCE;
			break;
		default:
			throw new Error("Invalid option");
	}

	return selectedHeightFunction;
}

// Function to resize the config.paint.image
export function resizePaintImage(
	//canvas: HTMLCanvasElement,
	imageToDraw: HTMLImageElement,
	exportConfig: IExportConfig,
	afterResize: (resized: HTMLImageElement) => void,
): void {
	if (!imageToDraw) {
		console.error("Source image is not loaded.");
		return;
	}

	const canvas = document.createElement("canvas") as HTMLCanvasElement;
	if (!canvas) {
		console.error("Element to resize is not provided.");
		return;
	}

	// Calculate the physical width and height based on detail size
	const pixelWidth = exportConfig.imageResolution.x;
	const pixelHeight = exportConfig.imageResolution.y;

	// Create a new canvas element with the calculated dimensions
	canvas.width = pixelWidth;
	canvas.height = pixelHeight;

	// Get the 2D rendering context of the canvas
	const ctx = canvas.getContext("2d");

	if (ctx) {
		// Draw the source image onto the canvas, scaling it to the new dimensions
		ctx.drawImage(imageToDraw, 0, 0, pixelWidth, pixelHeight);

		// Create a new Image object from the canvas data
		const resizedImage = new Image();
		resizedImage.onload = () => {
			afterResize(resizedImage);
		};
		resizedImage.src = canvas.toDataURL(); // Get the data URL of the canvas content
	} else {
		console.error("Could not get 2D rendering context for canvas.");
	}
}

/*export function autoUpdateImage() {
	const autoCheckbox = document.getElementById("auto-update-checkbox") as HTMLInputElement;

	if (autoCheckbox.checked) {
		updateImage();
	}
}*/

// @ts-ignore
//document.getElementById("update-painting-button").addEventListener("click", updateImage);
