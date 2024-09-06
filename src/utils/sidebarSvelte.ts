import { ItemView, WorkspaceLeaf } from "obsidian";
import Sidebar from "../components/Sidebar.svelte"

export const SVELTE_VIEW_TYPE = "Svelte-Sidebar";

export class SvelteSidebar extends ItemView {
    sidebar: Sidebar;
    
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
                variable: 1
            }
        })
    }

    async onClose() {
      this.sidebar.$destroy();
    }
}