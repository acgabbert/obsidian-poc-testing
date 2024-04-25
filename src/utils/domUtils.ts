export { removeElements }

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