import { App, ItemView, WorkspaceLeaf } from "obsidian";

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
    }

    protected async onClose(): Promise<void> {
        return;
    }
}