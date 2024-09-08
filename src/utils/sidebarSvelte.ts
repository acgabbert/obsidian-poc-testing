import { ItemView, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import Sidebar from "src/components/Sidebar.svelte";
import { type searchSite } from "./sidebar";
import { DOMAIN_REGEX, extractMatches, HASH_REGEX, IP_REGEX, refangIoc, removeArrayDuplicates, validateDomains } from "./textUtils";
import type MyPlugin from "main";

export const SVELTE_VIEW_TYPE = "Svelte-Sidebar";

export interface ParsedIndicators {
    title: string;
    items: string[];
    sites: searchSite[] | undefined;
}

export class SvelteSidebar extends ItemView {
    sidebar: Sidebar | undefined;
    iocs: ParsedIndicators[] | undefined;
    plugin: MyPlugin | undefined;
    
    ipRegex = IP_REGEX;
    hashRegex = HASH_REGEX;
    domainRegex = DOMAIN_REGEX;
    
    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
        super(leaf);
        this.registerActiveFileListener();
        this.registerOpenFile();
        this.iocs = [];
        this.plugin = plugin;
    }

    getViewType(): string {
        return SVELTE_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Svelte Sidebar";
    }

    registerActiveFileListener() {
        this.registerEvent(
            this.app.vault.on('modify', async (file: TAbstractFile) => {
                if (file === this.app.workspace.getActiveFile() && file instanceof TFile) {
                    await this.parseIndicators(file);
                }
            })
        );
    }

    registerOpenFile() {
        this.registerEvent(
            this.app.workspace.on('file-open', async (file: TFile | null) => {
                if (file && file === this.app.workspace.getActiveFile()) {
                    await this.parseIndicators(file);
                }
            })
        );
    }

    protected async onOpen(): Promise<void> {
        const file = this.app.workspace.getActiveFile();
        if (file) {
            await this.parseIndicators(file);
            if (this.iocs) {
                this.sidebar = new Sidebar({
                    target: this.contentEl,
                    props: {
                        indicators: this.iocs
                    }
                });
            }
        }
    }

    async getMatches(file: TFile) {
        console.log(`checking matches on ${file.basename}`)
        const fileContent = await this.app.vault.cachedRead(file);
        this.iocs = [];
        const ips: ParsedIndicators = {
            title: "IPs",
            items: extractMatches(fileContent, this.ipRegex),
            sites: this.plugin?.settings.searchSites.filter((x) => x.ip)
        }
        const domains: ParsedIndicators = {
            title: "Domains",
            items: extractMatches(fileContent, this.domainRegex),
            sites: this.plugin?.settings.searchSites.filter((x) => x.domain)
        }
        const hashes: ParsedIndicators = {
            title: "Hashes",
            items: extractMatches(fileContent, this.hashRegex),
            sites: this.plugin?.settings.searchSites.filter((x) => x.hash)
        }
        if (this.plugin?.validTld) 
            domains.items = validateDomains(domains.items, this.plugin.validTld);
        this.iocs.push(ips);
        this.iocs.push(domains);
        this.iocs.push(hashes);
        this.refangIocs();
        //this.processExclusions();
    }

    private refangIocs() {
        this.iocs?.forEach((iocList) => {
            iocList.items.map((x) => {
                refangIoc(x);
                x.toLowerCase();
            });
            iocList.items = removeArrayDuplicates(iocList.items);
        })
    }

    async parseIndicators(file: TFile) {
        await this.getMatches(file);
        this.sidebar?.$set({
            indicators: this.iocs
        });
    }

    async onClose() {
        this.sidebar?.$destroy();
    }
}