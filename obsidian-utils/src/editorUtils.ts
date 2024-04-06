import {Editor} from "obsidian";
export {transformSelectedText};

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