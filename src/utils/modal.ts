import { App, Modal, Notice, Setting, SuggestModal } from "obsidian";
import { constructMacroRegex, extractMacros, extractMatches, replaceMacros } from "./textUtils";
import { getActiveNoteContent } from "./workspaceUtils";

export { CodeListModal, CodeModal, ErrorModal, InputModal, OldInputModal };

export const supportedMacros = new Map<RegExp, RegExp>();
supportedMacros.set(/user(name)?/gi, constructMacroRegex(/user(?:\s*named?)?/)); // username
supportedMacros.set(/(host|computer|comp)(name)?/gi, constructMacroRegex(/(?:host|computer|comp)\s*(?:named?)?/)); // hostname/computername
supportedMacros.set(/(hash|sha256|sha)/gi, constructMacroRegex(/(?:hash|sha\s*256|sha)/)); // hash
supportedMacros.set(/(file(path)?|path)(name)?/gi, constructMacroRegex(/(?:(?:file\s*(?:path)?|path)\s*(?:name)?)/)); // file

class CodeListModal extends SuggestModal<string> {
    content: Map<string, string>;
    macros: Map<RegExp, RegExp>;

    constructor(app: App, content: Map<string, string>, macros?: Map<RegExp, RegExp>) {
        console.log('constructing modal')
        super(app);
        this.content = content;
        this.macros = supportedMacros;
        if (macros) this.macros = macros;
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
        console.log(extractedMacros);
        if (extractedMacros.length > 0) {
            // can pass on:
            // - the selected script
            // - the extracted macros
            new InputModal(this.app, result, extractedMacros).open();
        } else {
            new CodeModal(this.app, result).open();
        }
    }
}

class InputModal extends Modal {
    content: string;
    macros: string[];
    replacements: Map<string, string>;
    supportedMacros: Map<RegExp, RegExp>;

    constructor(app: App, content: string, macros: string[], passedMacros?: Map<RegExp, RegExp>) {
        super(app);
        this.content = content;
        this.macros = macros;
        this.replacements = new Map();
        this.supportedMacros = supportedMacros;
        if (passedMacros) this.supportedMacros = passedMacros;
    }

    async onOpen(): Promise<void> {
        const {contentEl} = this;
        let result = this.content;
        let activeNote = await getActiveNoteContent(this.app);
        contentEl.createEl("h1", {text: "Input Parameters:"});
        this.macros.forEach((contentMacro) => {
            let match = false;
            this.supportedMacros.forEach((value, key) => {
                if (!key.test(contentMacro) || !activeNote) return;
                const matches = extractMatches(activeNote, value);
                if (!(matches.length > 0)) return;
                match = true;
                contentEl.createEl("h2", {text: contentMacro});
                new Setting(contentEl)
                    .setName(contentMacro)
                    .setDesc("Values parsed from the active note")
                    .addDropdown((dropdown) => {
                        matches.forEach((match) => {
                            dropdown.addOption(match, match);
                        });
                        dropdown.addOption("*", "*");
                        this.replacements.set(contentMacro, dropdown.getValue());
                        dropdown.onChange((value) => {
                            this.replacements.set(contentMacro, value);
                        })
                    })
                new Setting(contentEl)
                    .setName(contentMacro)
                    .setDesc("Manual selection (overrides dropdown)")
                    .addText((text) => {
                        text.setPlaceholder("*");
                        text.onChange((input) => {
                            this.replacements.set(contentMacro, input);
                        })
                    })
                //result = result.replaceAll(value, contentMacro);
            })
            if (match) return;
            new Setting(contentEl)
                .setName(contentMacro)
                .addText((text) => {
                    text.setPlaceholder("*");
                    this.replacements.set(contentMacro, "*");
                    text.onChange((input) => {
                        this.replacements.set(contentMacro, input);
                    })
                })
        })
        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText("Submit").setCta().onClick(() => {
                    this.close();
                })
            })
    }

    onClose(): void {
        const {contentEl} = this;
        console.log(this.replacements);
        contentEl.empty();
        this.replacements.forEach((value, key) => {
            this.content = this.content.replaceAll(key, value);
        })
        new CodeModal(this.app, this.content).open();
    }
}

class OldInputModal extends Modal {
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