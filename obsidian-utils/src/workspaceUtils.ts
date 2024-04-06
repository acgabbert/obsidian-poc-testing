import { App, Modal, Setting } from "obsidian";

export {ErrorModal, InputModal};

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