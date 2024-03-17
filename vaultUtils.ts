import { App, Editor, Menu, MenuItem, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault, DropdownComponent } from 'obsidian';

export {checkFolderExistsRecursive, createFolderIfNotExists, todayFolderStructure};

/*
folder structure: YYYY/YYYY-QQ/YYYY-MM/YYYY-MM-DD
*/

function todayLocalDate() {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const date = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    return date;
}

function todayFolderStructure() {
    const date = todayLocalDate();
    const year = date.slice(0,4);
    const month = Number(date.slice(5,7));
    const yearMonth = date.slice(0,7);
    const quarter = Math.floor((month + 2) / 3);
    const folderArray = [year, `${year}-Q${quarter}`, yearMonth, date]
    const folders = folderArray.join('/');
    return folderArray;
}

async function checkFolderExistsRecursive(vault: Vault, folderName: string): Promise<string> {
    async function searchFolder(rootPath: string): Promise<string> {
        const checkVal = rootPath + "/" + folderName;
        const folderExists = await vault.adapter.exists(checkVal, true);
        if (folderExists) return folderName;
        const subFolders = (await vault.adapter.list(rootPath)).folders;
        // skip .obsidian config folder
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

async function createFolderIfNotExists(vault: Vault, folderName: string) {
    //const folderName = todayLocalDate();
    const folder = await checkFolderExistsRecursive(vault, folderName);
    console.log(`checking ${folderName}`);
    console.log(`folder found: ${folder}`);
    if (!folder) {
        console.log(`creating folder ${folderName}`);
        await vault.createFolder(folderName);
    } else {
        console.log('folder exists');
    }
}