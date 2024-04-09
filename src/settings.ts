import { App, PluginSettingTab, Setting } from "obsidian";

import MyPlugin from "main";

export { DEFAULT_SETTINGS, MySettingTab };
export type { MyPluginSettings };

interface MyPluginSettings {
	rootFolder: string;
	rootFolderDropdown: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	rootFolder: '',
	rootFolderDropdown: ''
}

class MySettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

		containerEl.empty();
		const vault = this.app.vault;
		const subFolders = (await vault.adapter.list('')).folders;

		new Setting(containerEl)
			.setName('Root Folder Dropdown')
			.setDesc('The folder to start searching from')
			.addDropdown( (dropdown) => {
				for (const subFolder in subFolders) {
					dropdown.addOption(subFolder, subFolder);
				}
				dropdown.onChange(async (value) => {
					this.plugin.settings.rootFolderDropdown = value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName('Root Folder')
			.setDesc('The folder to start searching from')
			.addText(text => text
				.setPlaceholder('notes')
				.setValue(this.plugin.settings.rootFolder)
				.onChange(async (value) => {
					this.plugin.settings.rootFolder = value;
					await this.plugin.saveSettings();
				})
			);
	}
}