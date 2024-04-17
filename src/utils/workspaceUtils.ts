import { App, ButtonComponent, MarkdownView, TFile, Workspace } from "obsidian";

export { addButtonContainer, addButtonToContainer, getActiveNoteContent };

function addButtonContainer(workspace: Workspace, file: TFile, className: string, rootFolder?: string) {
    const view = workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const container = view.containerEl;
    if (!container) return;
    const els = container.getElementsByClassName(className);
    if (els && els.length > 0) {
        Array.from(els).forEach((el: HTMLObjectElement) => {
            container.removeChild(el);
        });
    }
    if (rootFolder && !file.path.includes(rootFolder)) {
        console.log('File not in specified root folder');
        return;
    }
    const header = container.querySelector('.view-header');
    if (!header) return;
    const newDiv = document.createElement('div');
    newDiv.className = className;
    container.insertAfter(newDiv, header)
    return newDiv;
}

function addButtonToContainer(el: HTMLDivElement, buttonText: string) {
    const button = new ButtonComponent(el)
        .setButtonText(buttonText)
        .setCta();
    return button;
}

async function getActiveNoteContent(app: App) {
    const file = app.workspace.getActiveFile();
    if (!file) return null;
    return await app.vault.cachedRead(file);
}