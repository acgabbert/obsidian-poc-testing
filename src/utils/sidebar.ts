import { ItemView, TAbstractFile, TFile, WorkspaceLeaf, type EventRef } from "obsidian";
import Sidebar from "../components/Sidebar.svelte";
import { CyberPlugin, DOMAIN_REGEX, extractMatches, getAttachments, HASH_REGEX, initializeWorker, IP_REGEX, IPv6_REGEX, isLocalIpv4, type ParsedIndicators, refangIoc, removeArrayDuplicates, type searchSite, validateDomains } from "obsidian-cyber-utils";
import type Tesseract from "tesseract.js";
import OcrIndicators from "src/components/OcrIndicators.svelte";
import { ocrMultiple } from "./ocr";

export const SVELTE_VIEW_TYPE = "Svelte-Sidebar";

export class SvelteSidebar extends ItemView {
    sidebar: Sidebar | undefined;
    iocs: ParsedIndicators[] | undefined;
    ocrIocs: Promise<ParsedIndicators[]> | undefined;
    ocr: boolean = false;
    worker: Tesseract.Worker | undefined;
    plugin: CyberPlugin | undefined;
    splitLocalIp: boolean;

    ipExclusions: string[] | undefined;
    domainExclusions: string[] | undefined;
    hashExclusions: string[] | undefined;
    
    ipRegex = IP_REGEX;
    hashRegex = HASH_REGEX;
    domainRegex = DOMAIN_REGEX;
    ipv6Regex = IPv6_REGEX;

    openListener: EventRef;
    modifyListener: EventRef | null;
    
    constructor(leaf: WorkspaceLeaf, plugin: CyberPlugin, worker?: Tesseract.Worker) {
        super(leaf);
        this.plugin = plugin;
        this.modifyListener = this.registerActiveFileListener();
        console.log(this.modifyListener);
        this.openListener = this.registerOpenFile();
        this.iocs = [];
        this.splitLocalIp = true;
        if (worker) {
            this.ocr = true;
            this.worker = worker;
        }
    }

    getViewType(): string {
        return SVELTE_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Svelte Sidebar";
    }

    registerActiveFileListener(): EventRef | null {
        console.log('registering modification listener')
        if (!this.plugin) return null;
        let ref: EventRef;
        this.registerEvent(
            ref = this.plugin.app.vault.on('modify', async (file: TAbstractFile) => {
                console.log('-----------file modified-----------');
                if (!this.plugin) return;
                if (file === this.plugin.app.workspace.getActiveFile() && file instanceof TFile) {
                    console.log('parsing indicators')
                    await this.parseIndicators(file);
                }
            })
        );
        return ref;
    }

    registerOpenFile() {
        let ref: EventRef;
        this.registerEvent(
            ref = this.app.workspace.on('file-open', async (file: TFile | null) => {
                console.log('-----------file opened-----------');
                if (file && file === this.app.workspace.getActiveFile()) {
                    await this.parseIndicators(file);
                }
            })
        );
        return ref;
    }

    protected async onOpen(): Promise<void> {
        if (!this.plugin) return;
        const file = this.plugin.app.workspace.getActiveFile();
        if (file) {
            await this.parseIndicators(file);
            if (this.iocs) {
                this.sidebar = new Sidebar({
                    target: this.contentEl,
                    props: {
                        indicators: this.iocs,
                        ocrIndicators: this.ocrIocs
                    }
                });
            }
        }
    }

    async getFileContentMatches(file: TFile): Promise<ParsedIndicators[]> {
        if (!this.plugin) return [];
        const fileContent = await this.plugin.app.vault.cachedRead(file);
        return this.getMatches(fileContent);
    }

    async getMatches(fileContent: string): Promise<ParsedIndicators[]> {
        const retval = [];
        const ips: ParsedIndicators = {
            title: "IPs",
            items: extractMatches(fileContent, this.ipRegex),
            sites: this.plugin?.settings?.searchSites.filter((x: searchSite) => x.enabled && x.ip)
        }
        const domains: ParsedIndicators = {
            title: "Domains",
            items: extractMatches(fileContent, this.domainRegex),
            sites: this.plugin?.settings?.searchSites.filter((x: searchSite) => x.enabled && x.domain)
        }
        const hashes: ParsedIndicators = {
            title: "Hashes",
            items: extractMatches(fileContent, this.hashRegex),
            sites: this.plugin?.settings?.searchSites.filter((x: searchSite) => x.enabled && x.hash)
        }
        const privateIps: ParsedIndicators = {
            title: "IPs (Private)",
            items: [],
            sites: this.plugin?.settings?.searchSites.filter((x: searchSite) => x.enabled && x.ip)
        }
        const ipv6: ParsedIndicators = {
            title: "IPv6",
            items: extractMatches(fileContent, this.ipv6Regex),
            sites: this.plugin?.settings?.searchSites.filter((x: searchSite) => x.enabled && x.ip)
        }
        if (this.plugin?.validTld) 
            domains.items = validateDomains(domains.items, this.plugin.validTld);
        if (this.splitLocalIp) {
            ips.title = "IPs (Public)";
            for (let i = 0; i < ips.items.length; i++) {
                const item = ips.items[i];
                if(isLocalIpv4(item)) {
                    ips.items.splice(i, 1);
                    i--;
                    privateIps.items.push(item);
                }
            }
        }
        if (ips.items.length > 0) retval.push(ips);
        if (this.splitLocalIp && privateIps.items.length > 0) retval.push(privateIps);
        if (domains.items.length > 0) retval.push(domains);
        if (hashes.items.length > 0) retval.push(hashes);
        if (ipv6.items.length > 0) retval.push(ipv6)
        this.refangIocs();
        this.processExclusions();
        return retval;
    }

    async getOcrMatches(file: TFile): Promise<ParsedIndicators[]> {
        const app = this.plugin?.app;
        if (!app || !this.worker) return [];
        const attachments = getAttachments(file.path, app);
        console.log(`attachments:\n${attachments}`);
        const results = await ocrMultiple(app, attachments, null);
        if (!results) return [];
        console.log(results);
        const allResults = results.join("\n");
        return this.getMatches(allResults);
    }

    processExclusions() {
        this.iocs?.forEach(indicatorList => {
            switch(indicatorList.title) {
                case "IPs":
                    this.ipExclusions?.forEach(ip => {
                        if (indicatorList.items.includes(ip)) indicatorList.items.splice(indicatorList.items.indexOf(ip), 1);
                    });
                case "Domains":
                    this.domainExclusions?.forEach(domain => {
                        if (indicatorList.items.includes(domain)) indicatorList.items.splice(indicatorList.items.indexOf(domain), 1);
                    });
                case "Hashes":
                    this.hashExclusions?.forEach(hash => {
                        if (indicatorList.items.includes(hash)) indicatorList.items.splice(indicatorList.items.indexOf(hash), 1);
                    });
            }
        });
    }

    private refangIocs() {
        this.iocs?.forEach((iocList, index, array) => {
            iocList.items = iocList.items.map((x) => refangIoc(x));
            iocList.items = removeArrayDuplicates(iocList.items);
            array[index] = iocList;
        })
    }

    async parseIndicators(file: TFile) {
        if (!this.plugin) return;
        this.iocs = await this.getFileContentMatches(file);
        if (this.ocr) {
            this.ocrIocs = this.getOcrMatches(file);
        }
        this.sidebar?.$set({
            indicators: this.iocs,
            ocrIndicators: this.ocrIocs
        });
    }

    async onClose() {
        this.sidebar?.$destroy();
        this.plugin?.app.workspace.offref(this.openListener);
        if (this.modifyListener) this.plugin?.app.workspace.offref(this.modifyListener);
    }
}