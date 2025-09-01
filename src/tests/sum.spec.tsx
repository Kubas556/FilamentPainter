import { afterEach, beforeAll, expect, test } from "vitest";
import { screen, cleanup } from "@testing-library/react";
import { Layers } from "../ui/components/Layers";
import { renderWithLayout } from "./layoutContextMock";
import { defaultExportConfig } from "../ui/components/Export";
import { FilamentData } from "../ui/Filaments";

beforeAll(() => {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
});

afterEach(cleanup);

test("show right base layer end height", () => {
	const height = 0.2;
	renderWithLayout(Layers, {
		projectConfig: { baseLayerHeight: height, layerHeight: 0.08, selectedTopographyFunction: "" },
		exportConfig: defaultExportConfig,
		filamentLayers: [],
		image: undefined,
		computedData: undefined,
		sourceImage: undefined,
	});
	expect(screen.getByTestId("header").textContent).toBe(`End height: ${height.toFixed(2)} mm`);
});

test("show right layers end height", () => {
	const baseHeight = 0.2;
	const layers: FilamentData[] = [
		{ color: "", layerHeight: 0.08, name: "layer1", opacity: 0 },
		{ color: "", layerHeight: 0.16, name: "layer2", opacity: 0 },
	];
	renderWithLayout(Layers, {
		projectConfig: { baseLayerHeight: baseHeight, layerHeight: 0.08, selectedTopographyFunction: "" },
		exportConfig: defaultExportConfig,
		filamentLayers: layers,
		image: undefined,
		computedData: undefined,
		sourceImage: undefined,
	});
	expect(screen.getByTestId("header").textContent).toBe(
		`End height: ${(baseHeight + layers[0].layerHeight + layers[1].layerHeight).toFixed(2)} mm`,
	);
});
