import { App, Editor, EditorPosition, MarkdownView, TFile } from "obsidian";
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
    if (!view) return;
    const editor = view.editor;
    if (!editor || !vault || !file) return;
    vault.append(file, `\n${text}`);
    let lastLine = editor.lastLine();
    if (!lastLine) return;
    lastLine = lastLine - 1;
    let lastLineLen = editor.getLine(lastLine).length;
    if (!lastLineLen) return;
    const lastLinePos = {line: lastLine, ch: lastLineLen} as EditorPosition;
    editor.setCursor(lastLinePos);
    editor.scrollIntoView({from: LastLinePos, to: LastLinePos}, true);
    editor.focus();
}