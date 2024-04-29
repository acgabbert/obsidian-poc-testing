import { Editor, EventRef, MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf, request, RequestUrlParam } from 'obsidian';

import { DEFAULT_SETTINGS, MyPluginSettings, MySettingTab } from 'src/settings';
import {
	CodeListModal,
	addButtonContainer,
	addButtonToContainer,
	createFolderIfNotExists,
	createNote,
	defangDomain,
	parseCodeBlocks,
	PluginSidebar,
	todayFolderStructure,
	VIEW_TYPE,
	getValidTld,
	virusTotal,
	VT_DOMAIN
} from 'src/utils';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private transformRef: EventRef;

	async onload() {
		await this.loadSettings();
		const searchSites = new Map<string, string>();
		searchSites.set('DuckDuckGo', 'https://duckduckgo.com/?q=%s');
		this.registerView(VIEW_TYPE, (leaf) => new PluginSidebar(leaf, undefined, this.settings.validTld));
		this.addRibbonIcon("cat", "Activate view", () => {
			this.activateView();
		});

		const vault = this.app.vault;
		try {
			const data = await virusTotal(VT_DOMAIN, 'facebook.com', this.settings.vtApiKey);
			console.log(data);
		} catch(e) {
			console.log(e);
		}
		let tlds = await getValidTld();
		if (tlds) this.settings.validTld = tlds;
		await this.saveSettings();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			//new Notice(data['bio']);
			const folderArray = todayFolderStructure(true);
			for (let i = 1; i <= folderArray.length; i++) {
				createFolderIfNotExists(vault, `/${this.settings.rootFolder}/${folderArray.slice(0,i).join('/')}`)
			}
		});
		// This creates an icon in the left ribbon.
		const addNoteIcon = this.addRibbonIcon('file-plus-2', 'Create note from clipboard', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const folderArray = todayFolderStructure(true);
			for (let i = 1; i <= folderArray.length; i++) {
				createFolderIfNotExists(vault, `/${this.settings.rootFolder}/${folderArray.slice(0,i).join('/')}`)
			}
			console.log(`creating /${this.settings.rootFolder}/${folderArray.join('/')}`)
			createNote(vault, `/${this.settings.rootFolder}/${folderArray.join('/')}`, 'title');
		});
		const codeIcon = this.addRibbonIcon('shell', 'Copy code', async (evt: MouseEvent) => {
			const codeFile = this.app.vault.getFileByPath(this.settings.codeFile);
			if (!codeFile) return;
			const code = parseCodeBlocks(await this.app.vault.read(codeFile))
			if (!code) return;
			new CodeListModal(this.app, code).open();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection('Sample Editor Command');
			},
		});
		this.addCommand({
			id: 'transform-text',
			name: 'Transform text',
			editorCallback: (editor: Editor) => {
				console.log(editor.lastLine());
				const selection = editor.getSelection();
				console.log(`got ${selection}`);
				let replaced = defangDomain(selection);
				console.log(`replacing ${replaced}`);
				editor.replaceSelection(replaced);
			}
		});

		this.app.workspace.on('file-open', async (file: TFile) => {
			const className = 'my-button-container';
			const view = this.app.workspace.getActiveViewOfType(MarkdownView)?.containerEl;
			if (!view) return;
			const els = view.getElementsByClassName(className);
			if (els && els.length > 0) {
				Array.from(els).forEach((element: HTMLObjectElement) => {
					view.removeChild(element);
				})
			}
			const container = addButtonContainer(this.app.workspace, file, className);
			if (!container) return;
			const button = addButtonToContainer(container, 'Button!').onClick(() => {
				new Notice('Button clicked!')
			});
			const button2 = addButtonToContainer(container, 'Button 2!').onClick(() => {
				new Notice('Button clicked!')
			});
			const button3 = addButtonToContainer(container, 'Button 3!').onClick(() => {
				new Notice('Button clicked!')
			});
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MySettingTab(this.app, this));
		this.transformRef = this.app.workspace.on("editor-menu", (menu) => {
			menu.addItem((item) => {
				item.setTitle('Transform Text')
				.onClick(() => {
					const editor = this.app.workspace.activeEditor?.editor;
					if (editor) {
						const selection = editor.getSelection();
						let replaced = defangDomain(selection);
						editor.replaceSelection(replaced);
					}
				})
			})
		})
	}

	async activateView() {
		const {workspace} = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({type: VIEW_TYPE});
		}
		if (!leaf) return;
		workspace.revealLeaf(leaf);
	}

	onunload() {
		console.log('unloaded');
		this.app.workspace.offref(this.transformRef);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
