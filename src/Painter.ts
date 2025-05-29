import { initGL } from "./gl/Init";
import { setupReact } from "./ui/SetupReact";
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";

initGL();
//setupGoldenLayout();
setupReact();

/*document.addEventListener("DOMContentLoaded", () => {
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
setupImportProject();
setupExportProject();

document.getElementById("buy-commercial")?.addEventListener("click", () => {
	window.open("https://ko-fi.com/s/1d20470ee2", "_blank");
});*/
