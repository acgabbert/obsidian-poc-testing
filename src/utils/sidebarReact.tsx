import { createContext } from "react";
import { App, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";

export const AppContext = createContext<App | undefined>(undefined);

//export function IocList({})

type IocListProps = {
    title: string;
    indicators: string[];
}

export const IocList: React.FC<IocListProps> = ({title, indicators}) => {
    const indicatorList = indicators.map((item) => <div className="sidebar-list-item tree-item-self"><div className="tree-item-inner">{item}</div></div>)
    return <details className="sidebar-container tree-item" open>
        <summary className="tree-item-inner">{title}</summary>
        <div className="tree-item-children">
            {indicatorList}
        </div>
    </details>
}

export default function Sidebar() {
    const ipList = ['8.8.8.8', '9.9.9.9'];
    const domainList = ['facebook.com', 'google.com'];
    const hashList = ['6F26C1696C909282D86B1A4F2CD8B41D5F6F30C9DAE5D316035F657D461C7E07'];
    return (
        <>
            <IocList title="IPs" indicators={ipList}/>
            <IocList title="Domains" indicators={domainList}/>
            <IocList title="Hashes" indicators={hashList}/>
        </>
    )
}

export class ReactiveSidebar extends ItemView {
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf)
    }

    getViewType(): string {
        return 'Reactive Sidebar';
    }

    getDisplayText(): string {
        return 'Reactive Sidebar';
    }

    protected async onOpen(): Promise<void> {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(Sidebar());
    }

    protected async onClose(): Promise<void> {
        this.root?.unmount();
    }
}