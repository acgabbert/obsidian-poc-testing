import { Setting } from "obsidian";

export { datePickerSettingEl, openDetails, removeElements }

function removeElements(els: HTMLCollectionOf<Element>) {
    /**
     * remove a collection of elements
     * as commonly returned by `getElementsByClassName`
     * @param els a collection of HTML elements
     */
    if (els && els.length > 0) {
        Array.from(els).forEach((el: Element, index: number, array: Element[]) => {
            try {
                el.parentNode?.removeChild(el);
            } catch { }
        });
    }
}

function openDetails(els: HTMLCollectionOf<HTMLDetailsElement>) {
    /**
     * Open a collection of Details elements
     * @param els the collection of elements to be opened
     */
    if (els && els.length > 0) {
        Array.from(els).forEach((el: HTMLDetailsElement) => {
            try {
                el.open = true;
            } catch { }
        });
    }
}

function datePickerSettingEl(parentEl: HTMLElement, value?: string, name?: string): HTMLInputElement {
    /**
     * Add a date picker "setting"
     * @param parentEl the parent element to which the date picker will be added
     * @param value the default value of the date picker (optional)
     * @param name the display name for the date picker element (optional)
     * @returns the date picker element
     */
    value = value || new Date(Date.now()).toISOString();
    name = name || 'Date Picker';
    const fromDate = new Setting(parentEl).setName(name).settingEl;
    const fromDateEl = document.createElement("input");
    fromDateEl.setAttribute("type", "datetime-local");
    fromDateEl.setAttribute("value", value)
    fromDate.appendChild(fromDateEl);
    return fromDateEl;
}