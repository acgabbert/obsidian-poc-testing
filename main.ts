import { Editor, type EventRef, type MarkdownFileInfo, MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';

import { DEFAULT_SETTINGS, type MyPluginSettings, MySettingTab } from 'src/settings';
import {
	CodeListModal,
	addButtonContainer,
	addButtonToContainer,
	createFolderIfNotExists,
	createNote,
	defangDomain,
	parseCodeBlocks,
	SVELTE_VIEW_TYPE,
	SvelteSidebar,
	todayFolderStructure,
	getValidTld,
	virusTotal,
	VT_DOMAIN,
	removeElements,
	HASH_REGEX,
	VT_HASH,
	appendToEnd,
	DOMAIN_REGEX,
	type VtDomainAttributes
} from 'src/utils';

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	private transformRef: EventRef | undefined;
	validTld: string[] | null | undefined;

	async onload() {
		await this.loadSettings();
		const searchSites = new Map<string, string>();
		searchSites.set('DuckDuckGo', 'https://duckduckgo.com/?q=%s');
		this.registerView(SVELTE_VIEW_TYPE, (leaf) => new SvelteSidebar(leaf, this));
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
		this.validTld = await getValidTld();
		if (this.validTld) this.settings.validTld = this.validTld;
		else if (this.settings.validTld) this.validTld = this.settings.validTld;
		await this.saveSettings();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			//new Notice(data['bio']);
			const folderArray = todayFolderStructure(this.settings.folder);
			for (let i = 1; i <= folderArray.length; i++) {
				createFolderIfNotExists(vault, `/${this.settings.rootFolder}/${folderArray.slice(0,i).join('/')}`)
			}
		});
		// This creates an icon in the left ribbon.
		const addNoteIcon = this.addRibbonIcon('file-plus-2', 'Create note from clipboard', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const folderArray = todayFolderStructure(this.settings.folder);
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
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
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
				const replaced = defangDomain(selection);
				console.log(`replacing ${replaced}`);
				editor.replaceSelection(replaced);
			}
		});

		this.app.workspace.on('file-open', async (file: TFile | null) => {
			if (!file) return;
			const className = 'my-button-container';
			const view = this.app.workspace.getActiveViewOfType(MarkdownView)?.containerEl;
			if (!view) return;
			const els = view.getElementsByClassName(className);
			removeElements(els);
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
						const replaced = defangDomain(selection);
						editor.replaceSelection(replaced);
					}
				})
			})
		});
		this.transformRef = this.app.workspace.on("editor-menu", (menu) => {
			menu.addItem((item) => {
				item.setTitle('Search VirusTotal')
				.onClick(async () => {
					const editor = this.app.workspace.activeEditor?.editor;
					const file = this.app.workspace.getActiveFile();
					if (editor && file) {
						const selection = editor.getSelection();
						if (HASH_REGEX.test(selection)) {
							console.log('appending');
							const data = await virusTotal(VT_HASH, selection, this.settings.vtApiKey);
							appendToEnd(this.app, file, `\`\`\`ApiResult\n${data}\n\`\`\``);
						}
						if (DOMAIN_REGEX.test(selection)) {
							console.log('appending');
							const data = await virusTotal(VT_DOMAIN, selection, this.settings.vtApiKey);
							const attributes = data.attributes as VtDomainAttributes;
							console.log(data);
							console.log(attributes.last_analysis_stats);
							appendToEnd(this.app, file, `\`\`\`ApiResult\n${selection}\n${JSON.stringify(attributes.last_analysis_stats, null, 2)}\n\`\`\``);
						}
					}
				})
			})
		});
	}

	async activateView() {
		const {workspace} = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(SVELTE_VIEW_TYPE);
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({type: SVELTE_VIEW_TYPE});
		}
		if (!leaf) return;
		workspace.revealLeaf(leaf);
	}

	onunload() {
		console.log('unloaded');
		if (this.transformRef) this.app.workspace.offref(this.transformRef);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
