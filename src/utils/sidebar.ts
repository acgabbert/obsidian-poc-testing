import { ButtonComponent, ItemView, TFile, WorkspaceLeaf } from "obsidian";
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
    private tableClass = "sidebar-table-row";
    private tdClass = "sidebar-table-item";

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

    addIndicatorEl(parentEl: HTMLElement, indicator: string): void {
        if (!indicator) return;
        const el = parentEl.createDiv({cls: this.listItemClass});
        el.createDiv({cls: "tree-item-inner", text: indicator});
        const buttonEl = parentEl.createDiv({cls: "table-container"}).createEl("table").createEl("tr", {cls: this.tableClass});
        new ButtonComponent(buttonEl.createEl("td", {cls: this.tdClass}))
            .setButtonText('VT')
            .setClass('sidebar-button');
        new ButtonComponent(buttonEl.createEl("td", {cls: this.tdClass}))
            .setButtonText('IPDB')
            .setClass('sidebar-button');
        new ButtonComponent(buttonEl.createEl("td", {cls: this.tdClass}))
            .setButtonText('Google')
            .setClass('sidebar-button');
        return;
    }

    clearSidebar(container: Element): void {
        const els = container.getElementsByClassName(this.listClass);
        if (els && els.length > 0) {
            Array.from(els).forEach((el: HTMLObjectElement) => {
                try {
                    el.parentNode?.removeChild(el);
                } catch { }
            });
        }
        return;
    }

    async updateView(file: TFile) {
        const fileContent = await this.app.vault.cachedRead(file);
        this.ips = extractMatches(fileContent, IP_REGEX);
        this.domains = extractMatches(fileContent, DOMAIN_REGEX);
        this.hashes = extractMatches(fileContent, HASH_REGEX);
        const container = this.containerEl.children[1];
        this.clearSidebar(container);
        
        this.ips.forEach((ip) => {
            this.addIndicatorEl(this.ipEl, ip);
        });
        this.domains.forEach((domain) => {
            this.addIndicatorEl(this.domainEl, domain);
        });
        this.hashes.forEach((hash) => {
            this.addIndicatorEl(this.hashEl, hash);
        });
    }

    protected async onClose(): Promise<void> {
        return;
    }
}