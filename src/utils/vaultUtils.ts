import { App, TFile, Vault } from 'obsidian';

export { 
    checkFolderExistsRecursive,
    createFolderIfNotExists,
    createNote,
    getBacklinks,
    noteAppend,
    noteReplace,
    openNote,
    removeDotObsidian
};

async function checkFolderExistsRecursive(vault: Vault, folderName: string): Promise<string> {
    /**
     * Check if a given folder exists
     * @param rootPath the folder to start searching from
     * @returns folder name, blank if not exists
     */
    async function searchFolder(rootPath: string): Promise<string> {
        const checkVal = rootPath + "/" + folderName;
        const folderExists = await vault.adapter.exists(checkVal, true);
        if (folderExists) return folderName;
        const subFolders = (await vault.adapter.list(rootPath)).folders;
        // skip .obsidian config folder
        const i = subFolders.indexOf('.obsidian');
        //i > -1 ? subFolders.splice(i, 1) : {};
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

function removeDotObsidian(files: Array<string>) {
    /**
     * Remove .obsidian config folder, .DS_Store file from a list of file/folder names
     * @param files an array of file/folder names
     * @returns the array with unnecessary files removed
     */
    const removals = ['.obsidian', '.DS_Store'];
    removals.forEach((value) => {
        const i = files.indexOf(value);
        if (i > -1) {
            files.splice(i, 1);
        }
    })
    return files;
}

async function createFolderIfNotExists(vault: Vault, folderName: string) {
    /**
     * Creates a folder if it does not already exist.
     * @param vault
     */
    const folder = await checkFolderExistsRecursive(vault, folderName);
    if (!folder) {
        await vault.createFolder(folderName);
    }
}

async function createNote(vault: Vault, folderName: string, noteTitle: string): Promise<TFile> {
    /**
     * Creates a note within the given vault.
     * @param vault
     * @param folderName
     * @param noteTitle
     * @returns the note
     */
    return await vault.create(`${folderName}/${noteTitle}.md`, '');
}

function getBacklinks(notePath: string, app: App, resolved = false): Array<string> {
    /**
     * Get an array of the unresolved backlinks in a note.
     * @param notePath the note to check
     * @param app the current App class instance
     * @param resolved whether or not you want resolved links
     * @returns an array of strings
     */
    let backlinks = null;
    if (resolved) {
        backlinks = app.metadataCache.resolvedLinks[notePath];
    } else {
        backlinks = app.metadataCache.unresolvedLinks[notePath];
    }
    const retval = []
    for (const i in backlinks) {
        retval.push(i);
    }
    return retval;
}

function noteAppend(vault: Vault, note: TFile, content: string): Promise<string> {
    /**
     * Append to the end of a note
     * @param vault the current vault
     * @param note the note to append to
     * @param content the content to append
     * @returns the modified content
     */
    return vault.process(note, (data) => {
        return data + content;
    });
}

function noteReplace(vault: Vault, note: TFile, regex: RegExp, content: string): Promise<string> {
    /**
     * Replace content in a note by regular expression
     * @param vault the current vault
     * @param note the note to append to
     * @param regex the pattern to match for replacement
     * @param content the content to replace with 
     * @returns the modified content
     */
    return vault.process(note, (data) => {
        return data.replace(regex, content);
    });
}

function openNote(app: App, note: TFile) {
    /**
     * Opens the note in a new tab
     * @param app the current App class instance
     * @param note the file you would like to open
     */
    if (!note || !app) return;
    const view = app.workspace.getLeaf();
    view.openFile(note);
}