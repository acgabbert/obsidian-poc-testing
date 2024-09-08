import { ButtonComponent, ItemView, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { DOMAIN_REGEX, HASH_REGEX, IP_REGEX, extractMatches, refangIoc, removeArrayDuplicates, validateDomain } from "./textUtils";
import { openDetails, removeElements } from "./domUtils";
import { apiRequest, appendResult } from "./api";
import { VT_DOMAIN, type VtResponse } from "./vt";

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
    multisearch: boolean
    separator?: string
    enabled: boolean
}

export const vtSearch: searchSite = {
    name: 'VirusTotal',
    shortName: 'VT',
    site: VT_SEARCH,
    ip: true,
    hash: true,
    domain: true,
    multisearch: true,
    separator: '%20',
    enabled: true
}

export const ipdbSearch: searchSite = {
    name: 'AbuseIPDB',
    shortName: 'IPDB',
    site: IPDB_SEARCH,
    ip: true,
    hash: false,
    domain: true,
    multisearch: false,
    enabled: true
}

export const googleSearch: searchSite = {
    name: 'Google',
    shortName: 'Google',
    site: GOOGLE_SEARCH,
    ip: true,
    hash: true,
    domain: true,
    multisearch: false,
    enabled: true
}

export const IP_EXCLUSIONS = ["127.0.0.1"]
export const DOMAIN_EXCLUSIONS = ["google.com"]

export const defaultSites: searchSite[] = [vtSearch, ipdbSearch, googleSearch];

export class PluginSidebar extends ItemView {
    ips: string[] | undefined;
    ipExclusions: string[];
    ipMultisearch: Map<string, string>;
    domains: string[] | undefined;
    domainExclusions: string[];
    domainMultisearch: Map<string, string>;
    hashes: string[] | undefined;
    hashExclusions: string[]
    hashMultisearch: Map<string, string>;
    ipEl: HTMLDivElement | undefined;
    domainEl: HTMLDivElement | undefined;
    hashEl: HTMLDivElement | undefined;
    searchSites: searchSite[];
    sidebarTitle: string;
    validTld: string[] | undefined;

    ipRegex: RegExp;
    hashRegex: RegExp;
    domainRegex: RegExp;

    sidebarContainerClass = "sidebar-container tree-item";
    listClass = "sidebar-list-item";
    listItemClass = this.listClass + " tree-item-self";
    tableContainerClass = "table-container";
    tableClass = "sidebar-table-row";
    tdClass = "sidebar-table-item";

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
        this.ipExclusions = IP_EXCLUSIONS;
        this.domainExclusions = DOMAIN_EXCLUSIONS;
        this.hashExclusions = [];
        this.ipMultisearch = new Map();
        this.domainMultisearch = new Map();
        this.hashMultisearch = new Map();
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
        const containers = document.getElementsByClassName(this.sidebarContainerClass);
        openDetails(containers as HTMLCollectionOf<HTMLDetailsElement>);
        const file = this.app.workspace.getActiveFile();
        if (file) await this.updateView(file);
    }

    addContainer(el: Element, text: string) {
        const container = el.createEl("details", {cls: this.sidebarContainerClass});
        container.createEl("summary", {cls: "tree-item-inner", text: text});
        return container.createDiv({cls: "tree-item-children"});
    }

    registerActiveFileListener() {
        this.registerEvent(
            this.app.vault.on('modify', async (file: TAbstractFile) => {
                if (file === this.app.workspace.getActiveFile() && file instanceof TFile) {
                    await this.updateView(file);
                }
            })
        );
    }

    registerOpenFile() {
        this.registerEvent(
            this.app.workspace.on('file-open', async (file: TFile | null) => {
                if (file && file === this.app.workspace.getActiveFile()) {
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
                open(link);
            })
    }

    addApiButton(parentEl: HTMLElement, text: string, indicator: string) {
        new ButtonComponent(parentEl)
            .setButtonText(text)
            .setClass('sidebar-button')
            .onClick(async () => {
                const file = this.app.workspace.getActiveFile();
                if (!file) return;
                const data = apiRequest(VT_DOMAIN, indicator, "") as Promise<VtResponse>;
                appendResult(data, this.app, file);
            });
    }

    addIndicatorEl(parentEl: HTMLElement, indicator: string, indicatorType?: string): void {
        if (!indicator) return;
        const el = parentEl.createDiv({cls: this.listItemClass});
        el.createDiv({cls: "tree-item-inner", text: indicator});
        const buttonEl = parentEl.createDiv({cls: this.tableContainerClass}).createEl("table").createEl("tr", {cls: this.tableClass});
        this.searchSites.forEach((search) => {
            if (!search.enabled) return;
            switch(indicatorType) {
                case 'ip': {
                    if (search.ip) {
                        this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    }
                    break;
                }
                case 'domain': {
                    if (search.domain) {
                        this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    }
                    break;
                }
                case 'hash': {
                    if (search.hash) {
                        this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    }
                    break;
                }
                default: {
                    this.addButton(buttonEl.createEl("td", {cls: this.tdClass}), search.shortName, search.site.replace('%s', indicator));
                    break;
                }
            }
        });
        return;
    }

    clearSidebar(container: Element): void {
        const listEls = container.getElementsByClassName(this.listClass);
        const buttonEls = container.getElementsByClassName(this.tableContainerClass);
        const searchAllEls = container.getElementsByClassName(this.tableContainerClass);
        this.ipMultisearch.clear();
        this.domainMultisearch.clear();
        this.hashMultisearch.clear();
        removeElements(listEls);
        removeElements(buttonEls);
        removeElements(searchAllEls);
        return;
    }

    refangIocs() {
        this.ips = this.ips?.map((x) => refangIoc(x));
        this.domains = this.domains?.map((x) => refangIoc(x));
        if (this.ips) this.ips = removeArrayDuplicates(this.ips);
        if (this.domains) this.domains = removeArrayDuplicates(this.domains);
        this.hashes = this.hashes?.map((x) => x.toLowerCase());
    }

    processExclusions() {
        this.domainExclusions?.forEach((domain) => {
            if (!this.domains) return;
            if (this.domains.includes(domain)) this.domains.splice(this.domains.indexOf(domain), 1);
        });
        this.ipExclusions?.forEach((ip) => {
            if (!this.ips) return;
            if (this.ips.includes(ip)) this.ips.splice(this.ips.indexOf(ip), 1);
        });
        this.hashExclusions?.forEach((hash) => {
            if (!this.hashes) return;
            if (this.hashes.includes(hash)) this.hashes.splice(this.hashes.indexOf(hash), 1);
        });
    }

    validateDomains() {
        if (this.validTld && this.domains) {
            let index = this.domains.length - 1;
            while (index >= 0) {
                const domain = this.domains[index];
                if (!validateDomain(domain, this.validTld)) {
                    this.domains.splice(index, 1);
                }
                index -= 1;
            }
        }
    }

    async getMatches(file: TFile) {
        const fileContent = await this.app.vault.cachedRead(file);
        this.ips = extractMatches(fileContent, this.ipRegex);
        this.domains = extractMatches(fileContent, this.domainRegex);
        this.hashes = extractMatches(fileContent, this.hashRegex);
        this.refangIocs();
        this.validateDomains();
        this.processExclusions();
    }

    processIndicators(parentEl: HTMLElement, indicatorArray: string[], indicatorType: string, indicatorMultisearch: Map<string, string>) {
        indicatorArray.forEach((indicator) => {
            this.addIndicatorEl(parentEl, indicator, indicatorType);
            this.searchSites.forEach((site) => {
                if (site.multisearch && site.enabled) {
                    if (!indicatorMultisearch.has(site.shortName)) {
                        indicatorMultisearch.set(site.shortName, site.site.replace('%s', indicator));
                    } else {
                        const url = indicatorMultisearch.get(site.shortName);
                        if (!url) {
                            indicatorMultisearch.set(site.shortName, site.site.replace('%s', indicator));
                        } else if (!url.includes(indicator)) {
                            indicatorMultisearch.set(site.shortName, url + site.separator + indicator);
                        }
                    }
                }
            })
        });
        const summaryEl = parentEl.parentElement;
        if (!summaryEl || indicatorArray.length < 2) return;
        const buttonEl = parentEl.createDiv({cls: this.tableContainerClass}).createEl("table").createEl("tr", {cls: this.tableClass});
        indicatorMultisearch.forEach((value, key) => {
            this.addButton(buttonEl, `Search All - ${key}`, value);
        });
    }

    async updateView(file: TFile) {
        await this.getMatches(file);
        const container = this.containerEl.children[1];
        this.clearSidebar(container);
        if (this.ipEl && this.ips) this.processIndicators(this.ipEl, this.ips, 'ip', this.ipMultisearch);
        if (this.domainEl && this.domains) this.processIndicators(this.domainEl, this.domains, 'domain', this.domainMultisearch);
        if (this.hashEl && this.hashes) this.processIndicators(this.hashEl, this.hashes, 'hash', this.hashMultisearch);
    }

    protected async onClose(): Promise<void> {
        return;
    }
}