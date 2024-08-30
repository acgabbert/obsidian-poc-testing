import { App, TFile } from "obsidian";

export class PluginNote {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    registerActiveFileListener() {
        this.register(
            this.app.vault.on('modify', async (file: TFile) => {
                if (file === this.app.workspace.getActiveFile()) {
                    // do something
                    return;
                }
            })
        );
    }
}