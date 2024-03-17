import { App, Editor, Menu, MenuItem, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault, DropdownComponent } from 'obsidian';
import {checkFolderExistsRecursive, createFolderIfNotExists, todayFolderStructure} from 'vaultUtils';
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	rootFolder: string;
	rootFolderDropdown: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	rootFolder: '',
	rootFolderDropdown: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {

		await this.loadSettings();
		console.log(this.settings.rootFolder);
		const structure = todayFolderStructure();
		console.log(structure);
		const vault = this.app.vault;
		// dummy data
		const response = await fetch('https://api.github.com/users/github');
		const data = await response.json();
		console.log(data);
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice(data['bio']);
			const folderArray = todayFolderStructure();
			for (let i = 1; i <= folderArray.length; i++) {
				console.log(`trying to create ${folderArray.slice(0,i).join('/')}`);
				createFolderIfNotExists(vault, `/${this.settings.rootFolder}/${folderArray.slice(0,i).join('/')}`)
			}
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		this.addCommand({
			id: "test",
			name: "test",
			editorCallback: (editor: Editor) => {
				editor.replaceSelection(data['bio']);
			},
		});
		this.app.workspace.on("editor-menu", (menu) => {
			menu.addItem((item) => {
				item.setTitle('test')
				.onClick(() => {
					const view = this.app.workspace.getActiveViewOfType(MarkdownView);
					console.log(view);
					if (view) {
						console.log('made it here!')
						view.editor.replaceSelection(data['bio']);
					}
				})
			})
		})

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
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
