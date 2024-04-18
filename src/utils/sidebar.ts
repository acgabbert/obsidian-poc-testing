import { App, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { DOMAIN_REGEX, IP_REGEX, extractMatches } from "./textUtils";

export const VIEW_TYPE = "plugin-sidebar";

export class PluginSidebar extends ItemView {
    ips: string[];
    domains: string[];

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.registerActiveFileListener();
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
        const ips = container.createDiv({cls: "tree-item"});
        ips.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "IP addresses"});
        const ipChildren = ips.createDiv({cls: "tree-item-children"});
        const ipChild = ipChildren.createDiv({cls: "tree-item"});
        ipChild.createDiv({cls: "tree-item-self is-clickable", text: "test"})
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
        this.ips = extractMatches(fileContent, IP_REGEX);
        this.domains = extractMatches(fileContent, DOMAIN_REGEX);
        console.log(this.ips);
        console.log(this.domains);
    }

    protected async onClose(): Promise<void> {
        return;
    }
}