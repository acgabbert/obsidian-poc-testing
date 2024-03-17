import { App, Editor, Menu, MenuItem, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	rootFolder: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	rootFolder: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {

		await this.loadSettings();
		console.log(this.settings.rootFolder);
		const vault = this.app.vault;
		const today = new Date();
		//const folderName = today.toISOString().slice(0, 10);
		var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
		const folderName = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);		
		console.log(folderName)  // => '2015-01-26T06:40:36.181'
	
		const folderPath = `${folderName}`;

		const folderExists = this.checkFolderExistsRecursive(vault, folderName)
		console.log(folderExists)
		// dummy data
		const response = await fetch('https://api.github.com/users/github');
		const data = await response.json();
		console.log(data);
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice(data['bio']);
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

	async checkFolderExistsRecursive(vault: Vault, folderName: string): Promise<string> {
		async function searchFolder(rootPath: string): Promise<string> {
			const checkVal = rootPath + "/" + folderName;
			const folderExists = await vault.adapter.exists(checkVal, true);
            if (folderExists) return folderName;
            const subFolders = (await vault.adapter.list(rootPath)).folders;
			const i = subFolders.indexOf('.obsidian');
			if (i > -1) {
				subFolders.splice(i, 1);
			}
            for (const subFolder of subFolders) {
                const isSubFolder = await vault.adapter.exists(subFolder, true);
                if (isSubFolder) {
                    const found = await searchFolder(subFolder);
                    if (found && !found.startsWith(subFolder)) {
						return `${subFolder}/${found}`;
					} 
					else if (found) return found;
                }
            }

            return "";
        }

        return await searchFolder("");
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

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Root Folder')
			.setDesc('The folder to start searching from')
			.addText(text => text
				.setPlaceholder('example/path')
				.setValue(this.plugin.settings.rootFolder)
				.onChange(async (value) => {
					this.plugin.settings.rootFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}
