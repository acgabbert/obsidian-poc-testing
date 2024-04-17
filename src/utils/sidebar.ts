import { App, ItemView, TFile, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE = "plugin-sidebar";

export class PluginSidebar extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Plugin sidebar";
    }

    protected async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", {text: "Plugin sidebar!"});
        container.createEl("a", {href: "https://google.com", text: "GOOGLE"});
    }

    registerActiveFileListener() {
        this.registerEvent(
            this.app.vault.on('modify', async (file: TFile) => {
                if (file === this.app.workspace.getActiveFile()) {
                    await this.updateView(file);
                }
            })
        )
    }

    async updateView(file: TFile) {
        const fileContent = await this.app.vault.cachedRead(file);
        // parse the file content and populate the sidebar
    }

    protected async onClose(): Promise<void> {
        return;
    }
}