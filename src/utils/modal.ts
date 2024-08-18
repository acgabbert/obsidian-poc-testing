import { App, Modal, Notice, Setting, SuggestModal } from "obsidian";
import { constructMacroRegex, extractMacros, extractMatches, FILE_REGEX, MACRO_REGEX } from "./textUtils";
import { getActiveNoteContent } from "./workspaceUtils";
import { datePickerSettingEl } from "./domUtils";

export { CodeListModal, CodeModal, ErrorModal, InputModal };

export const supportedMacros = new Map<RegExp, RegExp[]>();
supportedMacros.set(/user(name)?/gi, [constructMacroRegex(/user\.?(?:\s*named?)?/)]); // username
supportedMacros.set(/(host|computer|comp)(name)?/gi, [constructMacroRegex(/(?:host|computer|comp)\.?\s*(?:named?)?/)]); // hostname/computername
supportedMacros.set(/(hash|sha256|sha)/gi, [constructMacroRegex(/(?:hash|sha\s*256|sha)/)]); // hash
supportedMacros.set(/(file(path)?|path)(name)?/gi, [FILE_REGEX, constructMacroRegex(/(?:(?:file\s*(?:path)?|path|attachments?)\.?\s*(?:name)?)/)]); // file

export interface Code {
    content: string,
    lang: string,
    icon?: string
}

export class ScriptObject {
    code: Code;
    dated: boolean;
    baseTimestamp?: number;
    fromTime?: number;
    toTime?: number;
    macros: string[];
    replacedCode: string;

    constructor(code: Code, dated?: boolean) {
        this.code = code;
        this.replacedCode = this.code.content;
        this.macros = extractMacros(this.code.content);
        this.dated = dated || false;
    }

    replaceMacros(replacements: Map<string, string>): void {
        replacements.forEach((value, key) => {
            this.replacedCode = this.replacedCode.replaceAll(key, value);
        });
        if (replacements.size < 1) this.replacedCode = this.code.content;
    }
}

type Class<CodeModal> = new (...args: any[]) => CodeModal;

class CodeListModal extends SuggestModal<string> {
    content: Map<string, Code>;
    macros: Map<RegExp, RegExp[]>;
    codeModal: Class<CodeModal>;

    constructor(app: App, content: Map<string, Code>, macros?: Map<RegExp, RegExp[]>, codeModal?: Class<CodeModal>) {
        super(app);
        this.content = content;
        this.macros = supportedMacros;
        if (macros) this.macros = macros;
        if (codeModal) this.codeModal = codeModal;
        else this.codeModal = CodeModal;
    }

    getSuggestions(query: string): string[] | Promise<string[]> {
        const keys = [...this.content.keys()];
        return keys.filter((item) =>
            item.toLowerCase().includes(query.toLowerCase())
            || this.content.get(item)?.content.toLowerCase().includes(query.toLowerCase())
            || this.content.get(item)?.lang.toLowerCase().includes(query.toLowerCase())
        );
    }

    renderSuggestion(value: string, el: HTMLElement) {
        const lineRegex = /([^\n]*\n?){0,4}/g;
        const item = this.content.get(value);
        if (!item) return;
        const itemArray = lineRegex.exec(item.content);
        if (!itemArray) return;
        const clippedItem = itemArray[0];
        //el.createEl("span") icon
        el.createEl("span", {text: value, cls: "code__suggestion_title"});
        el.createEl("span", {text: item.lang, cls: "code__language"});
        el.createEl("div", {text: clippedItem, cls: "code__suggestion"});
        if (item.content !== clippedItem) {
            el.createEl("div", {text: '...', cls: "code__suggestion_bottom"});
        }
    }
    
    onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
        const result = this.content.get(item)!.content;
        const selectedCode = new ScriptObject(this.content.get(item)!, true)
        const extractedMacros = extractMacros(result);
        if (extractedMacros.length > 0) {
            // can pass on:
            // - the selected script
            // - the extracted macros
            new InputModal(this.app, selectedCode, null, this.codeModal).open();
        } else {
            new this.codeModal(this.app, selectedCode).open();
        }
    }
}

class InputModal extends Modal {
    content: ScriptObject;
    replacements: Map<string, string>;
    supportedMacros: Map<RegExp, RegExp[]>;
    codeModal: Class<CodeModal>;
    datePicker: boolean;

    constructor(app: App, content: ScriptObject, passedMacros?: Map<RegExp, RegExp[]> | null, codeModal?: Class<CodeModal>) {
        super(app);
        this.content = content;
        this.replacements = new Map();
        this.supportedMacros = supportedMacros;
        this.datePicker = true;
        if (passedMacros) this.supportedMacros = passedMacros;
        if (codeModal) this.codeModal = codeModal;
        else this.codeModal = CodeModal;
    }
    
    addMacros(activeNote: string | null, contentEl: HTMLElement) {
    	this.content.macros.forEach((contentMacro) => {
            const regexTest = new RegExp(MACRO_REGEX.source, MACRO_REGEX.flags);
            const regexResults = regexTest.exec(contentMacro);
            let displayMacro = contentMacro;
            if (regexResults) {
                const macroWord = regexResults[2].toLowerCase();
                displayMacro = macroWord.charAt(0).toUpperCase() + macroWord.slice(1);
            }
            let match = false;
            this.supportedMacros.forEach((value, key) => {
                const tester = new RegExp(key.source, key.flags);
                if (!tester.test(contentMacro) || !activeNote) return;
                const matches = extractMatches(activeNote, value);
                if (!(matches.length > 0)) return;
                match = true;
                contentEl.createEl("h2", {text: displayMacro});
                new Setting(contentEl)
                    .setName(`${displayMacro} values parsed from the active note`)
                    //.setDesc("Values parsed from the active note")
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
                    .setName(`${displayMacro} manual selection (overrides dropdown)`)
                    //.setDesc("Manual selection (overrides dropdown)")
                    .addText((text) => {
                        text.setPlaceholder("*");
                        text.onChange((input) => {
                            this.replacements.set(contentMacro, input);
                        })
                    })
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
    }
    
    addDatePicker(contentEl: HTMLElement) {
    	if (this.content.dated && this.content.fromTime && this.content.toTime) {
            datePickerSettingEl(contentEl, new Date(this.content.fromTime).toISOString().slice(0,-8), "From Date").addEventListener("change", (event) => {
                this.content.fromTime = Date.parse((<HTMLInputElement>event.target)?.value);
            });
            datePickerSettingEl(contentEl, new Date(this.content.toTime).toISOString().slice(0,-8), "To Date").addEventListener("change", (event) => {
                this.content.toTime = Date.parse((<HTMLInputElement>event.target)?.value);
            });
    	}
    }

    async onOpen(): Promise<void> {
        const {contentEl} = this;
        const activeNote = await getActiveNoteContent(this.app);
        contentEl.createEl("h1", {text: "Input Parameters:"});
        this.addMacros(activeNote, contentEl);
        this.addDatePicker(contentEl);
        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText("Submit").setCta().onClick(() => {
                    this.close();
                })
            })
        
        this.scope.register([], "Enter", (evt: KeyboardEvent) => {
            if (evt.isComposing) {
                return;
            }
            evt.preventDefault();
            evt.stopPropagation();
            this.close();
        })
    }

    onClose(): void {
        const {contentEl} = this;
        contentEl.empty();
        this.content.replaceMacros(this.replacements);
        new this.codeModal(this.app, this.content).open();
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
    code: ScriptObject;

    constructor(app: App, code: ScriptObject) {
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
                    if (!this.code.replacedCode)
                    await navigator.clipboard.writeText(this.code.replacedCode);
                    new Notice('Copied to clipboard!');
                }));
        contentEl.createEl("code", {text: this.code.replacedCode, cls: "code__modal"});
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}