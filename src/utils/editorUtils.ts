import { App, Editor, MarkdownView, TFile } from "obsidian";
export { appendToEnd, transformSelectedText };

function transformSelectedText(editor: Editor, func: Function) {
    /**
     * Transforms the text selected by the user.
     * @param editor
     * @param func the function to perform on the text
     * @returns the transformed text
     */
    const selection = editor.getSelection();
    let transformed = func(selection);
    editor.replaceSelection(transformed);
    return transformed;
}

function appendToEnd(app: App, file: TFile, text: string) {
    if (!app) return;
    const vault = app.vault;
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;
    if (!editor || !vault || !file) return;
    vault.append(file, `\n${text}`);
    let lastLine = editor.lastLine();
    if (!lastLine) return;
    lastLine = lastLine - 1;
    let lastLineLen = editor.getLine(lastLine).length;
    if (!lastLineLen) return;
    console.log(`last line: ${lastLine}\n${editor.getLine(lastLine)}\nlength: ${lastLineLen}`);
    editor.setCursor({line: lastLine, ch: lastLineLen});
    editor.focus();
}