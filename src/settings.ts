import { App, PluginSettingTab, Setting } from "obsidian";

import MyPlugin from "main";
import { defaultSites, type folderPrefs, removeDotObsidian, type searchSite } from "./utils";
import Settings from "./components/Settings.svelte";

export { DEFAULT_SETTINGS, MySettingTab };
export type { MyPluginSettings };

interface MyPluginSettings {
	rootFolder: string;
	rootFolderDropdown: string;
    codeFile: string;
	vtApiKey: string;
	ipdbApiKey: string;
	validTld: string[];
	searchSites: searchSite[];
	folder: folderPrefs;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	rootFolder: '',
	rootFolderDropdown: '',
    codeFile: '',
	vtApiKey: '',
	ipdbApiKey: '',
	validTld: [],
	searchSites: defaultSites,
	folder: {year: true, quarter: true, month: true, day: true}
}

class MySettingTab extends PluginSettingTab {
	plugin: MyPlugin;
	settingsView: Settings | undefined;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

		this.settingsView = new Settings({
			target: containerEl,
			props: {
				settings: [true]
			}
		});
	}
}