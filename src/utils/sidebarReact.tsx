import { createContext, useEffect, useState } from "react";
import { App, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { DOMAIN_REGEX, extractMatches, HASH_REGEX, IP_REGEX, refangIoc, removeArrayDuplicates, validateDomain } from "./textUtils";
import { defaultSites, ipdbSearch, searchSite } from "./sidebar";

export const AppContext = createContext<App | undefined>(undefined);
export const REACTIVE_VIEW_TYPE = 'Reactive Sidebar';

type ButtonProps = {
    search: searchSite[];
    indicator: string;
}

type IocListProps = {
    title: string;
    indicators: string[];
}

type SidebarProps = {
    app: App;
}

export class ReactiveSidebar extends ItemView {
    root: Root | null = null;

    ips: string[];
    ipExclusions: string[];
    ipMultisearch: Map<string, string>;
    domains: string[];
    domainExclusions: string[];
    domainMultisearch: Map<string, string>;
    hashes: string[];
    hashExclusions: string[]
    hashMultisearch: Map<string, string>;
    searchSites: searchSite[];
    validTld: string[];

    ipRegex: RegExp = IP_REGEX;
    hashRegex: RegExp = HASH_REGEX;
    domainRegex: RegExp = DOMAIN_REGEX;

    constructor(leaf: WorkspaceLeaf, searchSites?: searchSite[], validTld?: string[]) {
        super(leaf)
        if (searchSites) this.searchSites = searchSites;
        else this.searchSites = defaultSites;
        if (validTld) this.validTld = validTld;
        this.ips = [];
        this.domains = [];
        this.hashes = [];
    }

    getViewType(): string {
        return REACTIVE_VIEW_TYPE;
    }

    getDisplayText(): string {
        return REACTIVE_VIEW_TYPE;
    }
    
    Buttons: React.FC<ButtonProps> = ({search, indicator}) => {
        const searchList = search.map((item) => 
            <>
                <td className="sidebar-table-item">
                    <a href={item.site.replace('%s', indicator)} target="_blank" rel="noopener noreferrer">
                        <button className="sidebar-button">{item.shortName}</button>
                    </a>
                </td>
            </>
        )
        return <div className="table-container">
            <table>
                <tr className="sidebar-table-row">
                    {searchList}
                </tr>
            </table>
        </div>
    }
    
    IocList: React.FC<IocListProps> = ({title, indicators}) => {
        const indicatorList = indicators.map((item) => 
            <>
                <div className="sidebar-list-item tree-item-self">
                    <div className="tree-item-inner">{item}</div>
                </div>
                <this.Buttons search={this.searchSites} indicator={item}/>
            </>
        );
        return <details className="sidebar-container tree-item" open>
            <summary className="tree-item-inner">{title}</summary>
            <div className="tree-item-children">
                {indicatorList}
            </div>
        </details>
    }

    Sidebar: React.FC<SidebarProps> = ({app}) => {
        const [ips, setIps] = useState<string[]>([]);
        const [domains, setDomains] = useState<string[]>([]);
        const [hashes, setHashes] = useState<string[]>([]);

        const getMatches = async (file: TFile) => {
            const fileContent = await this.app.vault.cachedRead(file);
            const newIps = extractMatches(fileContent, IP_REGEX);
            const newDomains = extractMatches(fileContent, DOMAIN_REGEX);
            const newHashes = extractMatches(fileContent, HASH_REGEX);
            this.refangIocs();
            this.validateDomains();
            setIps(newIps);
            setDomains(newDomains);
            setHashes(newHashes);
            //this.processExclusions();
        }

        useEffect(() => {
            const activeFile = app.workspace.getActiveFile();
            if (activeFile) {
                getMatches(activeFile);
            }
            // Register listeners for file modifications and opening
            const modifyListener = app.vault.on('modify', async (file: TFile) => {
                if (file === app.workspace.getActiveFile()) {
                    await getMatches(file);
                }
            });

            const openFileListener = app.workspace.on('file-open', async (file: TFile) => {
                if (file === app.workspace.getActiveFile()) {
                    await getMatches(file);
                }
            });

            // Cleanup listeners on component unmount
            return () => {
                app.vault.offref(modifyListener);
                app.workspace.offref(openFileListener);
            };
        }, []);

        return (
            <>
                <this.IocList title="IPs" indicators={this.ips}/>
                <this.IocList title="Domains" indicators={this.domains}/>
                <this.IocList title="Hashes" indicators={this.hashes}/>
            </>
        )
    }

    protected async onOpen(): Promise<void> {
        this.root = createRoot(this.containerEl.children[1]);
        const file = this.app.workspace.getActiveFile();
        //if (file) await this.getMatches(file);
        this.root.render(this.Sidebar(this.app));
    }

    protected async onClose(): Promise<void> {
        this.root?.unmount();
    }

    refangIocs() {
        this.ips = this.ips?.map((x) => refangIoc(x));
        this.domains = this.domains?.map((x) => refangIoc(x));
        this.ips = removeArrayDuplicates(this.ips);
        this.domains = removeArrayDuplicates(this.domains);
        this.hashes = this.hashes?.map((x) => x.toLowerCase());
    }

    validateDomains() {
        if (this.validTld) {
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
}