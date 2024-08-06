import { Setting } from "obsidian";

export { datePickerSettingEl, openDetails, removeElements }

function removeElements(els: HTMLCollectionOf<Element>) {
    /**
     * remove a collection of elements
     * as commonly returned by `getElementsByClassName`
     * @param els a collection of HTML elements
     */
    if (els && els.length > 0) {
        Array.from(els).forEach((el: HTMLObjectElement) => {
            try {
                el.parentNode?.removeChild(el);
            } catch { }
        });
    }
}

function openDetails(els: HTMLCollectionOf<HTMLDetailsElement>) {
    if (els && els.length > 0) {
        Array.from(els).forEach((el: HTMLDetailsElement) => {
            console.log(`trying to open ${el}`)
            try {
                el.open = true;
            } catch { }
        });
    }
}

function datePickerSettingEl(parentEl: HTMLElement, value?: string, name?: string): HTMLInputElement {
    /**
     * Add a date picker "setting" 
     */
    value = value || new Date(Date.now()).toISOString();
    name = name || 'Date Picker';
    console.log(`time: ${value}`)
    const fromDate = new Setting(parentEl).setName(name).settingEl;
    const fromDateEl = document.createElement("input");
    fromDateEl.setAttribute("type", "datetime-local");
    fromDateEl.setAttribute("value", value)
    fromDate.appendChild(fromDateEl);
    return fromDateEl;
}