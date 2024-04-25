import { App, ButtonComponent, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { DOMAIN_REGEX, HASH_REGEX, IP_REGEX, extractMatches } from "./textUtils";

export const VIEW_TYPE = "plugin-sidebar";

export class PluginSidebar extends ItemView {
    ips: string[];
    domains: string[];
    hashes: string[];
    ipEl: HTMLDivElement;
    domainEl: HTMLDivElement;
    hashEl: HTMLDivElement;

    private sidebarContainerClass = "sidebar-container tree-item";
    private listClass = "sidebar-list-item";
    private listItemClass = this.listClass + " tree-item-self";

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
        container.createEl("h4", {text: "Extracted indicators!"});
        const ipContainer = container.createDiv({cls: this.sidebarContainerClass});
        ipContainer.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "IPs"});
        this.ipEl = ipContainer.createDiv({cls: "tree-item-children"});
        const domainContainer = container.createDiv({cls: this.sidebarContainerClass});
        domainContainer.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "Domains"})
        this.domainEl = domainContainer.createDiv({cls: "tree-item-children"});
        const hashContainer = container.createDiv({cls: this.sidebarContainerClass});
        hashContainer.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "Hashes"});
        this.hashEl = hashContainer.createDiv({cls: "tree-item-children"});
    }

    registerActiveFileListener() {
        this.registerEvent(
            this.app.vault.on('modify', async (file: TFile) => {
                console.log(`file updated: ${file.path}`);
                if (file === this.app.workspace.getActiveFile()) {
                    await this.updateView(file);
                }
            })
        );
    }

    async updateView(file: TFile) {
        const fileContent = await this.app.vault.cachedRead(file);
        this.ips = extractMatches(fileContent, IP_REGEX);
        this.domains = extractMatches(fileContent, DOMAIN_REGEX);
        this.hashes = extractMatches(fileContent, HASH_REGEX);
        const container = this.containerEl.children[1];
        const els = container.getElementsByClassName(this.listClass);
        if (els && els.length > 0) {
            Array.from(els).forEach((el: HTMLObjectElement) => {
                try {
                    el.parentNode?.removeChild(el);
                } catch { }
            });
        }
        
        this.ips.forEach((ip) => {
            console.log(`ip: ${ip}`);
            if (!ip) return;
            const el = this.ipEl.createDiv({cls: this.listItemClass}).createDiv({cls: "tree-item-inner", text: ip});
            const button = new ButtonComponent(el)
                .setButtonText('VT')
                .setClass('sidebar-button');
            return button;
        });
        this.domains.forEach((domain) => {
            console.log(`domain: ${domain}`);
            if (!domain) return;
            this.domainEl.createDiv({cls: this.listItemClass}).createDiv({cls: "tree-item-inner", text: domain});
        });
        this.hashes.forEach((hash) => {
            console.log(`hash: ${hash}`);
            if (!hash) return;
            this.hashEl.createDiv({cls: this.listItemClass}).createDiv({cls: "tree-item-inner", text: hash});
        });
    }

    protected async onClose(): Promise<void> {
        return;
    }
}