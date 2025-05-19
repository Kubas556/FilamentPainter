class FilamentComponent extends HTMLElement {
    constructor() {
        super();
        let template = document.getElementById("filament-layer") as HTMLTemplateElement;
        let templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }
}

export function setupCustom() {
    customElements.define("filament-layer", FilamentComponent);
}