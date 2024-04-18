import { App, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { DOMAIN_REGEX, HASH_REGEX, IP_REGEX, extractMatches } from "./textUtils";

export const VIEW_TYPE = "plugin-sidebar";

export class PluginSidebar extends ItemView {
    ips: string[];
    domains: string[];
    hashes: string[];
    ipEl: HTMLDivElement;
    domainEl: HTMLDivElement;
    hashEl: HTMLDivElement;

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
        const ipContainer = container.createDiv({cls: "tree-item"});
        ipContainer.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "IPs"});
        this.ipEl = ipContainer.createDiv({cls: "tree-item-children"});
        const domainContainer = container.createDiv({cls: "tree-item"});
        domainContainer.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "Domains"})
        this.domainEl = domainContainer.createDiv({cls: "tree-item-children"});
        const hashContainer = container.createDiv({cls: "tree-item"});
        hashContainer.createDiv({cls: "tree-item-self is-clickable mod-collapsible", text: "Hashes"});
        this.hashEl = hashContainer.createDiv({cls: "tree-item-children"});
        //this.ipEl = ipContainer.createDiv({cls: "sidebar-container tree-item-self is-clickable"});
        //this.ipEl.createDiv({cls: "sidebar-container-title", text: "IP addresses"});
        //this.domainEl = domainContainer.createDiv({cls: "sidebar-container tree-item-self is-clickable"});
        //this.domainEl.createDiv({cls: "sidebar-container-title tree-item-self is-clickable", text: "Domains"});
        //this.hashEl = hashContainer.createDiv({cls: "sidebar-container"});
        //this.hashEl.createDiv({cls: "sidebar-container-title", text: "Hashes"});
    }

    registerActiveFileListener() {
        this.registerEvent(
            this.app.vault.on('modify', async (file: TFile) => {
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
        const els = container.getElementsByClassName('sidebar-list-item');
        if (els && els.length > 0) {
            Array.from(els).forEach((el: HTMLObjectElement) => {
                container.removeChild(el);
            });
        }
        
        this.ips.forEach((ip) => {
            console.log(`ip: ${ip}`);
            if (!ip) return;
            this.ipEl.createDiv({cls: "sidebar-list-item tree-item-self is-clickable", text: ip});
        });
        this.domains.forEach((domain) => {
            console.log(`domain: ${domain}`);
            if (!domain) return;
            this.domainEl.createDiv({cls: "sidebar-list-item tree-item-self is-clickable", text: domain});
        });
        this.hashes.forEach((hash) => {
            console.log(`hash: ${hash}`)
            if (!hash) return;
            this.hashEl.createDiv({cls: "sidebar-list-item tree-item-self is-clickable", text: hash});
        });
    }

    protected async onClose(): Promise<void> {
        return;
    }
}