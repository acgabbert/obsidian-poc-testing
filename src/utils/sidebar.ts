import { ButtonComponent, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { DOMAIN_REGEX, HASH_REGEX, IP_REGEX, extractMatches, validateDomain } from "./textUtils";
import { openDetails, removeElements } from "./domUtils";

export const VIEW_TYPE = "plugin-sidebar";

export const VT_SEARCH = 'https://virustotal.com/gui/search/%s';
export const IPDB_SEARCH = 'https://abuseipdb.com/check/%s';
export const GOOGLE_SEARCH = 'https://google.com/search?q=%s';

export interface searchSite {
    name: string
    shortName: string
    site: string
    ip: boolean
    hash: boolean
    domain: boolean
}

export const vtSearch: searchSite = {
    name: 'VirusTotal',
    shortName: 'VT',
    site: VT_SEARCH,
    ip: true,
    hash: true,
    domain: true
}

export const ipdbSearch: searchSite = {
    name: 'AbuseIPDB',
    shortName: 'IPDB',
    site: IPDB_SEARCH,
    ip: true,
    hash: false,
    domain: true
}

export const googleSearch: searchSite = {
    name: 'Google',
    shortName: 'Google',
    site: GOOGLE_SEARCH,
    ip: true,
    hash: true,
    domain: true
}

export const defaultSites: searchSite[] = [vtSearch, ipdbSearch, googleSearch];

export class PluginSidebar extends ItemView {
    ips: string[];
    domains: string[];
    hashes: string[];
    ipEl: HTMLDivElement;
    domainEl: HTMLDivElement;
    hashEl: HTMLDivElement;
    searchSites: searchSite[];
    sidebarTitle: string;
    validTld: string[];

    ipRegex: RegExp;
    hashRegex: RegExp;
    domainRegex: RegExp;

    private sidebarContainerClass = "sidebar-container tree-item";
    private listClass = "sidebar-list-item";
    private listItemClass = this.listClass + " tree-item-self";
    private tableContainerClass = "table-container";
    private tableClass = "sidebar-table-row";
    private tdClass = "sidebar-table-item";

    constructor(leaf: WorkspaceLeaf, searchSites?: searchSite[], validTld?: string[]) {
        super(leaf);
        this.registerActiveFileListener();
        this.registerOpenFile();
        this.searchSites = defaultSites;
        this.sidebarTitle = 'Extracted Indicators';
        this.ipRegex = IP_REGEX;
        this.hashRegex = HASH_REGEX;
        this.domainRegex = DOMAIN_REGEX;
        if (validTld) this.validTld = validTld;
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
        this.ipEl = this.addContainer(container, "IPs");
        this.domainEl = this.addContainer(container, "Domains");
        this.hashEl = this.addContainer(container, "Hashes");
        let containers = document.getElementsByClassName(this.sidebarContainerClass);
        openDetails(containers as HTMLCollectionOf<HTMLDetailsElement>);
        const file = this.app.workspace.getActiveFile();
        if (file) await this.updateView(file);
    }

    addContainer(el: Element, text: string) {
        const container = el.createEl("details", {cls: this.sidebarContainerClass});
        /*
        const collapsible = container.createDiv({cls: "tree-item-self is-clickable mod-collapsible"});
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttr("width", "24");
        svg.setAttr("height", "24");
        svg.setAttr("viewBox", "0 0 24 24");
        svg.setAttr("fill", "none");
        svg.setAttr("fill", "none");
        svg.setAttr("stroke", "currentColor");
        svg.setAttr("stroke-width", "2");
        svg.setAttr("stroke-linecap", "round");
        svg.setAttr("stroke-linejoin", "round");
        svg.setAttr("class", "svg-icon right-triangle");
        svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path")).setAttr("d", "M3 8L12 17L21 8");
        collapsible.createDiv({cls: "tree-item-icon collapse-icon"}).appendChild(svg);
        */
        container.createEl("summary", {cls: "tree-item-inner", text: text});
        return container.createDiv({cls: "tree-item-children"});
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

    addIndicatorEl(parentEl: HTMLElement, indicator: string, indicatorType?: string): void {
        if (!indicator) return;
        const el = parentEl.createDiv({cls: this.listItemClass});
        el.createDiv({cls: "tree-item-inner", text: indicator});
        const buttonEl = parentEl.createDiv({cls: this.tableContainerClass}).createEl("table").createEl("tr", {cls: this.tableClass});
        this.searchSites.forEach((search) => {
            switch(indicatorType) {
                case 'ip': {
                    if (search.ip) {
                        this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    }
                }
                case 'domain': {
                    if (search.domain) {
                        this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    }
                }
                case 'hash': {
                    if (search.hash) {
                        this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    }
                }
                default: {
                    this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                }
            }
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

    async getMatches(file: TFile) {
        const fileContent = await this.app.vault.cachedRead(file);
        this.ips = extractMatches(fileContent, this.ipRegex);
        this.domains = extractMatches(fileContent, this.domainRegex);
        if (this.validTld) {
            this.domains.forEach((domain, index, object) => {
                if (!validateDomain(domain, this.validTld)) {
                    console.log(`${domain} doesn't match`)
                    object.splice(index, 1);
                }
            });
        }
        this.hashes = extractMatches(fileContent, this.hashRegex);
    }

    async updateView(file: TFile) {
        await this.getMatches(file);
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