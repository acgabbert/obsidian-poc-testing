import { App, ButtonComponent, MarkdownView, Modal, Notice, Setting, SuggestModal, TFile, Workspace } from "obsidian";
import { extractMacros, replaceMacros } from "./textUtils";

export { addButtonContainer, addButtonToContainer, CodeListModal, CodeModal, ErrorModal, InputModal };

function addButtonContainer(workspace: Workspace, file: TFile, className: string, rootFolder?: string) {
    const view = workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const container = view.containerEl;
    if (!container) return;
    const els = container.getElementsByClassName(className);
    if (els && els.length > 0) {
        Array.from(els).forEach((el: HTMLObjectElement) => {
            container?.removeChild(el);
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

class InputModal extends Modal {
    input: Map<string, string>;
    params: string[];
    onSubmit: (input: Map<string, string>) => void;

    constructor(app: App, matches: string[], onSubmit: (result: Map<string, string>) => void) {
        super(app);
        this.params = matches;
        this.input = new Map();
        this.onSubmit = onSubmit;
    }

    onOpen(): void {
        const {contentEl} = this;
        contentEl.createEl("h1", {text: "Input Parameters:"});
        
        this.params.forEach((param) => {
            new Setting(contentEl)
                .setName(param)
                .addText((text) =>
                    text.onChange((input) => {
                        this.input.set(param, input);
                    }));
        });

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Submit")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.input);
                    }));
    }

    onClose(): void {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class ErrorModal extends Modal {
    text: string;

    constructor(app: App, text: string) {
        super(app);
        this.text = text;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl("h1", {text: "Error"});
        contentEl.createEl("div", {text: this.text});
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class CodeListModal extends SuggestModal<string> {
    content: Map<string, string>;
    macros: Map<string, RegExp>;

    constructor(app: App, content: Map<string, string>, macros: Map<string, RegExp>) {
        super(app);
        this.content = content;
        this.macros = macros;
    }

    getSuggestions(query: string): string[] | Promise<string[]> {
        const keys = [...this.content.keys()];
        return keys.filter((item) =>
            item.toLowerCase().includes(query.toLowerCase()) || this.content.get(item)?.toLowerCase().includes(query.toLowerCase())
        );
    }

    renderSuggestion(value: string, el: HTMLElement) {
        const lineRegex = /([^\n]*\n?){0,4}/g;
        const item = this.content.get(value);
        const clippedItem = lineRegex.exec(item!)![0];
        el.createEl("div", {text: value});
        el.createEl("div", {text: clippedItem, cls: "code__suggestion"});
        if (item !== clippedItem) {
            el.createEl("div", {text: '...', cls: "code__suggestion_bottom"});
        }
    }
    
    onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
        let result = this.content.get(item)!;
        const extractedMacros = extractMacros(result);
        extractedMacros.forEach((contentMacro) => {
            this.macros.forEach((value, key) => {
                if (value.test(contentMacro)) {
                    const val = new Map();
                    val.set(contentMacro, key);
                    result = replaceMacros(result, val);
                }
            })
        })
        new CodeModal(this.app, result).open();
    }
}

class CodeModal extends Modal {
    code: string;

    constructor(app: App, code: string) {
        super(app);
        this.code = code;
    }

    onOpen(): void {
        const {contentEl} = this;
        new Setting(contentEl)
            .addButton((btn) => 
            btn
                .setButtonText("Copy to clipboard")
                .setCta()
                .onClick(async () => {
                    await navigator.clipboard.writeText(this.code);
                    new Notice('Copied to clipboard!');
                }));
        contentEl.createEl("code", {text: this.code, cls: "code__modal"});
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}