export { openDetails, removeElements }

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