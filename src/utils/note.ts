import { App, TFile } from "obsidian";

export class PluginNote {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    registerActiveFileListener() {
        this.register(
            this.app.vault.on('modify', async (file: TFile) => {
                if (file === this.app.workspace.getActiveFile()) {
                    // do something
                    return;
                }
            })
        );
    }
}

export interface MetadataField {
	name: string;
	regex: RegExp;
}

export class MarkdownParser {
	[x: string]: any;
	private fields: MetadataField[];
	private parsedData: { [key: string]: string };

	constructor(fields: MetadataField[]) {
		this.fields = fields;
		this.parsedData = {};
		
		return new Proxy(this, {
			get(target, prop) {
				if (prop in target) {
					return target[prop as keyof MarkdownParser];	
				}
				return target.parsedData[prop as string];
			}
		}
	}

	parse(content: string): void {
		this.parsedData = {};
		this.fields.forEach(field => {
			const match = field.regex.exec(content);
			if (match && match[1]) {
				this.parsedData[field.name] = match[1].trim();
			}
		});
	}

	get(fieldName: string): string | undefined {
		return this.parsedData[fieldName];
	}

	addField(field: MetadataField): void {
		this.fields.push(field);
	}	

	removeField(fieldName: string): void {
		this.fields = this.fields.filter(f => f.name !== fieldName);
	}
}