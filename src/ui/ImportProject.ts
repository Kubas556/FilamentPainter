export function setupImportProject() {
    var importButtonProject = document.getElementById("import-project") as HTMLButtonElement;
    importButtonProject.addEventListener("click", () => openFileDialog(importProject));
}

function openFileDialog(callback: (e: Event) => void) {
    var input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "application/json");
    input.addEventListener("change", callback);
    document.body.appendChild(input);
    input.click();

    document.body.removeChild(input);
}

function importProject(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = (readEvent) => {
            const res = readEvent.target?.result as string;
            console.log(res);
        };
        reader.readAsText(file);
    }
}