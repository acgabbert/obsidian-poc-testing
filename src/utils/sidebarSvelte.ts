import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";
import Sidebar from "src/components/Sidebar.svelte";
import IocList from "src/components/IocList.svelte";

export const SVELTE_VIEW_TYPE = "Svelte-Sidebar";

export class SvelteSidebar extends ItemView {
    sidebar: Sidebar | undefined;
    title: string | undefined;
    
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return SVELTE_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Svelte Sidebar";
    }

    protected async onOpen(): Promise<void> {
        this.sidebar = new Sidebar({
            target: this.contentEl,
            props: {
                
            }
        });
    }

    async onClose() {
        this.sidebar?.$destroy();
    }
}