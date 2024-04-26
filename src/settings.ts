import { App, PluginSettingTab, Setting } from "obsidian";

import MyPlugin from "main";
import { removeDotObsidian } from "./utils";

export { DEFAULT_SETTINGS, MySettingTab };
export type { MyPluginSettings };

interface MyPluginSettings {
	rootFolder: string;
	rootFolderDropdown: string;
    codeFile: string;
	vtApiKey: string;
	ipdbApiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	rootFolder: '',
	rootFolderDropdown: '',
    codeFile: '',
	vtApiKey: '',
	ipdbApiKey: ''
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
        let topLevelFiles = (await vault.adapter.list('')).files;
        topLevelFiles = removeDotObsidian(topLevelFiles);


		new Setting(containerEl)
			.setName('Root folder dropdown')
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
			.setName('Code file')
			.setDesc("The file where you'll store your code snippets")
            .addDropdown((dropdown) => {
                topLevelFiles.forEach((file) => {
                    dropdown.addOption(file, file.replace(".md", ""));
                });
                dropdown.setValue(this.plugin.settings.codeFile);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.codeFile = value;
                    await this.plugin.saveSettings();
                })
            })
		new Setting(containerEl)
			.setName('VirusTotal API Key')
			.addText((text) => {
				text.setValue(this.plugin.settings.vtApiKey);
				text.onChange(async (value) => {
					this.plugin.settings.vtApiKey = value;
					await this.plugin.saveSettings();
				})
			})
		new Setting(containerEl)
			.setName('AbuseIPDB API Key')
			.addText((text) => {
				text.setValue(this.plugin.settings.ipdbApiKey);
				text.onChange(async (value) => {
					this.plugin.settings.ipdbApiKey = value;
					await this.plugin.saveSettings();
				})
			})
	}
}