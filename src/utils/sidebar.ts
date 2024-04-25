import { ButtonComponent, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { DOMAIN_REGEX, HASH_REGEX, IP_REGEX, extractMatches } from "./textUtils";
import { removeElements } from "./domUtils";

export const VIEW_TYPE = "plugin-sidebar";

export const VT_SEARCH = 'https://virustotal.com/gui/search/%s';
export const IPDB_SEARCH = 'https://abuseipdb.com/check/%s';
export const GOOGLE_SEARCH = 'https://google.com/search?q=%s';

export const defaultSearchSites = new Map<string, string>();
defaultSearchSites.set('VT', VT_SEARCH);
defaultSearchSites.set('AbuseIPDB', IPDB_SEARCH);
defaultSearchSites.set('Google', GOOGLE_SEARCH);

export class PluginSidebar extends ItemView {
    ips: string[];
    domains: string[];
    hashes: string[];
    ipEl: HTMLDivElement;
    domainEl: HTMLDivElement;
    hashEl: HTMLDivElement;
    searchSites: Map<string, string>;
    sidebarTitle: string;

    private sidebarContainerClass = "sidebar-container tree-item";
    private listClass = "sidebar-list-item";
    private listItemClass = this.listClass + " tree-item-self";
    private tableContainerClass = "table-container";
    private tableClass = "sidebar-table-row";
    private tdClass = "sidebar-table-item";

    constructor(leaf: WorkspaceLeaf, searchSites?: Map<string, string>) {
        super(leaf);
        this.registerActiveFileListener();
        this.registerOpenFile();
        this.searchSites = defaultSearchSites;
        this.sidebarTitle = 'Extracted Indicators';
        if (searchSites) this.searchSites = searchSites;
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
        container.createEl("h4", {text: this.sidebarTitle});
        const ipContainer = container.createDiv({cls: this.sidebarContainerClass});
        ipContainer.createEl("h4", {cls: "tree-item-self is-clickable mod-collapsible", text: "IPs"});
        this.ipEl = ipContainer.createDiv({cls: "tree-item-children"});
        const domainContainer = container.createDiv({cls: this.sidebarContainerClass});
        domainContainer.createEl("h4", {cls: "tree-item-self is-clickable mod-collapsible", text: "Domains"})
        this.domainEl = domainContainer.createDiv({cls: "tree-item-children"});
        const hashContainer = container.createDiv({cls: this.sidebarContainerClass});
        hashContainer.createEl("h4", {cls: "tree-item-self is-clickable mod-collapsible", text: "Hashes"});
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

    registerOpenFile() {
        this.registerEvent(
            this.app.workspace.on('file-open', async (file: TFile) => {
                console.log(`file opened: ${file.path}`);
                if (file === this.app.workspace.getActiveFile()) {
                    await this.updateView(file);
                }
            })
        );
    }

    addButton(parentEl: HTMLElement, text: string, link: string) {
        new ButtonComponent(parentEl)
            .setButtonText(text)
            .setClass('sidebar-button')
            .onClick(() => {
                open(link)
            })
    }

    addIndicatorEl(parentEl: HTMLElement, indicator: string): void {
        if (!indicator) return;
        const el = parentEl.createDiv({cls: this.listItemClass});
        el.createDiv({cls: "tree-item-inner", text: indicator});
        const buttonEl = parentEl.createDiv({cls: this.tableContainerClass}).createEl("table").createEl("tr", {cls: this.tableClass});
        this.searchSites.forEach((value, key) => {
            this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), key, value.replace('%s', indicator));
        });
        return;
    }

    clearSidebar(container: Element): void {
        const listEls = container.getElementsByClassName(this.listClass);
        const buttonEls = container.getElementsByClassName(this.tableContainerClass);
        removeElements(listEls);
        removeElements(buttonEls);
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