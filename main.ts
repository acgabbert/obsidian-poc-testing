import { App, Editor, type EventRef, type MarkdownFileInfo, MarkdownView, Modal, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	appendToEnd,
	CodeListModal,
	addButtonContainer,
	addButtonToContainer,
	createFolderIfNotExists,
	createNote,
	defangDomain,
	parseCodeBlocks,
	todayFolderStructure,
	getValidTld,
	removeElements,
	HASH_REGEX,
	DOMAIN_REGEX,
	getBacklinks,
} from "obsidian-cyber-utils";
import { 
	SVELTE_VIEW_TYPE, DropdownLinkModal, type DropdownOption,
	SettingCollectionModal, type BooleanSetting
} from "obsidian-svelte-components";

import { DEFAULT_SETTINGS, type MyPluginSettings, MySettingTab } from 'src/settings';
import {
	virusTotal,
	VT_HASH,
	VT_DOMAIN,
	type VtDomainAttributes
} from 'src/utils';
import { initializeWorker, ocr, ocrMultiple } from 'src/utils/ocr';
import { SvelteSidebar } from 'src/utils/sidebar';
import type { Worker } from 'tesseract.js';

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	private transformRef: EventRef | undefined;
	validTld: string[] | null | undefined;
	worker: Worker | undefined;

	async onload() {
		await this.loadSettings();
		this.worker = await initializeWorker();
		const searchSites = new Map<string, string>();
		searchSites.set('DuckDuckGo', 'https://duckduckgo.com/?q=%s');
		this.registerView(SVELTE_VIEW_TYPE, (leaf) => {
			const sidebar = new SvelteSidebar(leaf, this, this.worker);
			sidebar.splitLocalIp = false;
			return sidebar;
		});
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
			const attachments = getAttachments(file.path, this.app);
			if (!this.worker) return;
			//const results = await ocrMultiple(this.app, attachments, this.worker);
			//console.log(results);
			const className = 'my-button-container';
			const view = this.app.workspace.getActiveViewOfType(MarkdownView)?.containerEl;
			if (!view) return;
			const els = view.getElementsByClassName(className);
			removeElements(els);
			const container = addButtonContainer(this.app.workspace, file, className);
			if (!container) return;
			const button = addButtonToContainer(container, 'Button!').onClick(() => {
				const options: DropdownOption[] = [
					{label: "Google", url: "https://www.google.com"},
					{label: "GitHub", url: "https://www.github.com"},
					{label: "Hacker News", url: "https://news.ycombinator.com/"}
				]
				new DropdownLinkModal(this.app, options).open();
			});
			const button2 = addButtonToContainer(container, 'Button 2!').onClick(() => {
				console.log('trying');
				let checkboxModal = new Modal(this.app);
				const target = checkboxModal.contentEl;
				if (!target) return;
				console.log('target exists');
				const settings: BooleanSetting[] = [
					{
						key: "booleanTest",
						displayName: "Boolean Test!",
						value: this.settings["booleanTest"]
					}
				];
				new SettingCollectionModal(this, settings, "title", async (settings) => {
					console.log(this.settings);
					settings.forEach(async (setting, index) => {
						if (setting.key !== undefined) {
							const settingKey: keyof MyPluginSettings = setting.key;
							if (this.settings[settingKey] === undefined) return;
							this.settings[settingKey] = setting.value;
							console.log(`set ${this.settings[settingKey]}`);
						}
						await this.saveSettings();
					});
				}).open();
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
		if (this.worker) this.worker.terminate();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		console.log('saving settings');
		await this.saveData(this.settings);
	}
}

function getAttachments(notePath: string, app: App): Array<string> {
    let attachments: string[] = [];
    const links = getBacklinks(notePath, app, true);
    links.forEach((link) => {
        const file = app.vault.getAbstractFileByPath(link);
        if (file && file instanceof TFile && file.extension !== "md") {
            attachments.push(file.path);
        }
    });
    return attachments;
}