import { createContext } from "react";
import { App, ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";

export const AppContext = createContext<App | undefined>(undefined);

//export function IocList({})

type IocListProps = {
    title: string;
    indicators: string[];
}

export const IocList: React.FC<IocListProps> = ({title, indicators}) => {
    const indicatorList = indicators.map((item) => <div>{item}</div>)
    return <details>
        <summary>{title}</summary>
        <div>{indicatorList}</div>
    </details>
}
/*
export function IocList({title, indicators}) {
    const indicatorList = indicators.map((item) => <div>{item}</div>)
    return <details>
        <summary>{title}</summary>
        <div>{indicatorList}</div>
    </details>
}
*/
export default function Sidebar() {
    return (
        <>
            <IocList title="IPs" indicators={['asdf', 'qwerty']}/>
            <IocList title="Domains" indicators={['asdf', 'qwerty']}/>
            <IocList title="Hashes" indicators={['asdf', 'qwerty']}/>
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