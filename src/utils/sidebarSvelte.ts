import { ItemView, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import Sidebar from "src/components/Sidebar.svelte";
import { vtSearch, type searchSite } from "./sidebar";
import { DOMAIN_REGEX, extractMatches, HASH_REGEX, IP_REGEX } from "./textUtils";

export const SVELTE_VIEW_TYPE = "Svelte-Sidebar";

export interface ParsedIndicators {
    title: string;
    items: string[];
    sites: searchSite[];
}

export class SvelteSidebar extends ItemView {
    sidebar: Sidebar | undefined;
    iocs: ParsedIndicators[] | undefined;
    
    ipRegex = IP_REGEX;
    hashRegex = HASH_REGEX;
    domainRegex = DOMAIN_REGEX;
    
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.registerActiveFileListener();
        this.registerOpenFile();
        this.iocs = [];
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
                if (file === this.app.workspace.getActiveFile() && file) {
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
            sites: [vtSearch]
        }
        const domains: ParsedIndicators = {
            title: "Domains",
            items: extractMatches(fileContent, this.domainRegex),
            sites: [vtSearch]
        }
        const hashes: ParsedIndicators = {
            title: "Hashes",
            items: extractMatches(fileContent, this.hashRegex),
            sites: [vtSearch]
        }
        this.iocs.push(ips);
        this.iocs.push(domains);
        this.iocs.push(hashes);
        //this.refangIocs();
        //this.validateDomains();
        //this.processExclusions();

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