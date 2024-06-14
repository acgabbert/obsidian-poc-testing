import { App, RequestUrlParam, TFile, request } from "obsidian";
import { Code, InputModal } from "./modal";
export {
    addUniqueValuesToArray,
    constructMacroRegex,
    defangIp,
    defangDomain,
    extractMacros,
    extractMatches,
    findFirstByRegex,
    friendlyDatetime,
    getValidTld,
    lowerSha256,
    lowerMd5,
    parameterizeCodeBlock,
    parseCodeBlocks,
    refangIoc,
    removeArrayDuplicates,
    replaceMacros,
    replaceTemplateText,
    todayLocalDate,
    todayFolderStructure,
    validateDomain
}

// regex for possibly defanged values
export const IP_REGEX = /(\d{1,3}\[?\.\]?\d{1,3}\[?\.\]?\d{1,3}\[?\.\]?\d{1,3})/gi;
export const DOMAIN_REGEX = /((?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.|\[\.\]))+[a-zA-Z][a-zA-Z0-9-]{0,61}[a-zA-Z](?=\.?)\b)/gi;
export const HASH_REGEX = /(?:^|[^a-fA-F0-9]*)([a-fA-F0-9]{64}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})/gi;
export const FILE_REGEX = /(?:^|\s|")((\w:\\|[\\\/])[^\\\/]+[\\\/]([^\\\/\n"|]+[\\\/]?)+(\.\w+)?)/gi;

export const TLD_URL = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';

async function getValidTld(): Promise<string[] | null> {
    const tldParams = {url: 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt', throw: true} as RequestUrlParam;
    try {
        const data = await request(tldParams);
        const tlds = data.split('\n');
        if (tlds[0].startsWith('#')) tlds.shift(); // first line comment
        if (!tlds.slice(-1)[0]) tlds.pop(); // last line empty string
        return tlds;
    } catch {
        console.log('failed to get valid TLDs');
        return null;
    }
}

function todayLocalDate(): string {
    /**
     * @returns current local date as a string in format YYYY-MM-DD
     */
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const date = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    return date;
}

function localDateTime() {
    /**
     * @returns the local date/time in format `YYYY-MM-DD HH:SS`
     */
    return `${todayLocalDate()} ${new Date(Date.now()).toString().slice(16, 21)}`
}

function todayFolderStructure(quarter: boolean): Array<string> {
    /**
     * Returns a string with the folder structure for the current date
     * Format: `YYYY/YYYY-QQ/YYYY-MM/YYYY-MM-DD`
     * 
     * @param quarter - Boolean specifying whether to include quarter (YYYY-QQ) in the folder structure
     * @returns the folder structure for the current date
     */
    const date = todayLocalDate();
    const year = date.slice(0,4);
    const month = Number(date.slice(5,7));
    const yearMonth = date.slice(0,7);
    const currentQuarter = Math.floor((month + 2) / 3);
    const folderArray = [year, yearMonth, date]
    if (quarter) {
        folderArray.splice(1, 0, `${year}-Q${currentQuarter}`)
    }
    const folders = folderArray.join('/');
    return folderArray;
}

function defangIp(text: string): string {
    /**
     * Defangs IP addresses, e.g. `8.8.8.8` becomes `8.8.8[.]8`
     * @returns input string with IP addresses defanged
     */
    return text.replaceAll(/(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})/g, "$1[.]$2");
}

function defangDomain(text: string): string {
    /**
     * Defangs domains preceded with http(s), e.g. `https://google.com` 
     * becomes `hxxps[://]google[.]com`
     * @returns input string with domains defanged
     */
    const httpString = /http(s?):\/\//g;
    const anyDomain = /(([a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.?)+)\.((xn--)?([a-z][a-z0-9\-]{1,60}|[a-z][a-z0-9-]{1,29}\.[a-z]{2,}))/g;
    let retval = text.replaceAll(httpString, "hxxp$1[://]");
    retval = retval.replaceAll(anyDomain, "$1[.]$3");
    return retval;
}

function refangIoc(text: string): string {
    /**
     * refang an IOC (domain, URL, IP address)
     */
    let retval = text.replace('[.]', '.');
    retval = retval.replace('hxxp', 'http');
    retval = retval.replace('[:]', ':');
    retval = retval.replace('[://]', '://');
    retval = retval.toLowerCase();
    return retval;
}

function lowerSha256(text: string): string {
    /**
     * Converts SHA256 hashes (or any 64 character alphanumeric string) to lowercase
     * @returns input string with SHA256 hashes converted to lowercase
     */
    return text.replace(/(\w{64})/g, function(match) {
        return match.toLowerCase();
    });
}

function lowerMd5(text: string): string {
    /**
     * Converts MD5 hashes (or any 32 character alphanumeric string) to lowercase
     * @returns input string with MD5 hashes converted to lowercase
     */
    return text.replace(/(\w{32})/g, function(match) {
        return match.toLowerCase();
    });
}

const dateTimeRegex = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\s+UTC)/g;
function friendlyDatetime(text: string): string {
    /**
     * Converts a datetime string in the format `YYYY-MM-DD HH:MM:SS UTC`
     * to the following: `YYYY-MM-DD at HH:MM:SS UTC`
     * @returns input string with datetimes converted to "{date} at {time}"
     */
    return text.replace(dateTimeRegex, "$1 at $2");
}

function findFirstByRegex(text: string, regex: RegExp): string {
    /**
     * Find the first match of a regex in the given string.
     * @param text the text to search
     * @param regex the regular expression to match
     * @returns first match of a regex in the given string
     */
    const result = regex.exec(text);
    if (!result) {
        throw Error;
    } else {
        return result[1]
    }
}

function replaceTemplateText(template: string, content: string, note: TFile, contentMacro: string = "{{content}}") {
    /**
     * Put a template around the given content.
     * Supported macros: 
     * - {{title}} the note title
     * - {{date}} the date in format YYYY-MM-DD
     * - {{time}} the time in format HH:SS
     * - {{content}} the content you want to replace'
     * @param template the template
     * @param content the content
     * @param note the note to which it will be inserted
     * @param contentMacro the string to replace content with @default "{{content}}"
     */
    let template_replaced = template.replaceAll("{{title}}", note.name.slice(0, -3));
    const dateTime = localDateTime().split(" ");
    template_replaced = template_replaced.replaceAll("{{date}}", dateTime[0]);
    template_replaced = template_replaced.replaceAll("{{time}}", dateTime[1]);
    template_replaced = template_replaced.replaceAll(contentMacro, content);
    return template_replaced;
}

export const MACRO_REGEX = /(\{\{([^\}]+)\}\})/g;
function extractMacros(text: string): string[] {
    /**
     * Extract macros in the format {{macro}}
     * @param text
     * @returns a unique list of macros in the text
     */
    let regexTest = new RegExp(MACRO_REGEX.source, MACRO_REGEX.flags);
    const matches = text.matchAll(regexTest);
    return addUniqueValuesToArray([], matches);
}

function extractMatches(text: string, pattern: RegExp | RegExp[]): string[] {
    /**
     * Extracts matches for all of the given regular expressions.
     * @param text the text to check against
     * @param pattern the regex pattern(s) to evaluate
     * @returns an array of strings that matched the given regex
     */
    if (Array.isArray(pattern)) {
        const matches = new Array();
        pattern.forEach((value) => {
            addUniqueValuesToArray(matches, text.matchAll(value));
        });
        return matches;
    } else {
        const matches = text.matchAll(pattern);
        return addUniqueValuesToArray([], matches);
    }
}

function replaceMacros(text: string, replacements: Map<string, string>): string {
    /**
     * Replace (1:1) keys with their associated values in the provided text.
     * @param text the text in which to replace
     * @param replacements the map of keys to values
     * @returns the input with replaced text
     */
    let retval = text;
    replacements.forEach((value, key) => {
        retval = retval.replaceAll(key, value);
    });
    return retval;
}

async function parameterizeCodeBlock(evt: MouseEvent, app: App): Promise<string> {
    /**
     * Upon copying a code block in preview mode, 
     * replace macros surrounded by double curly braces 
     * e.g. {{macro}}
     * with user input.
     * @param evt a mouse event
     * @param app the current App class instance
     * @returns the code block text with macros replaces
     */
    let text = "";
    const target = <HTMLButtonElement>evt.target;
    // check for copy code button in preview mode
    if (target.parentElement?.firstChild && target['className'] === 'copy-code-button') {
        const child = <HTMLElement>target.parentElement.firstChild;
        text = <string>child.innerText;
        let macroArray = extractMacros(text);
        if (macroArray.length > 0) {
            new InputModal(app, text, macroArray);
        } else {
            console.log('No parameter matches');
        }
    }
    return text;
}

function addUniqueValuesToArray(array: string[], values: IterableIterator<RegExpMatchArray>): string[] {
    /**
     * Add unique values from the passed RegExpMatchArray to the given array of strings
     * @param array an array of strings
     * @param values a set of regex matches
     * @returns the passed array with unique values added
     */
    const valueArray = [...values];
    valueArray.forEach((match) => {
        if (!array.includes(match[1])) {
            array.push(match[1]);
        }
    });
    return array;
}

function parseCodeBlocks(content: string): Map<string, Code> {
    /**
     * Parse code blocks and the headers before them
     * @param content file content
     * @returns a mapping of headers to code blcok content
     */
    const retval = new Map();
    const codeBlockRegex = /#+\s+(.+)$\n+```(\w*)\n(((?!^```\n).|\n)*)\n^```$/gm;
    const matches = content.matchAll(codeBlockRegex);
    const matchArray = [...matches];
    matchArray.forEach((match) => {
        if (!retval.has(match[1])) {
            const code: Code = {
                content: match[3],
                lang: match[2]
            };
            retval.set(match[1], code);
        }
    });
    return retval;
}

export const macroSeparator = "(?:\\s*[:=]\\s*|\\s+)";
export const macroValue = "([^\\}\\s]+)";
function constructMacroRegex(macroRegex: string | RegExp): RegExp {
    if (macroRegex instanceof RegExp) macroRegex = macroRegex.source;
    const retval = new RegExp(macroRegex + macroSeparator + macroValue, "gi");
    return retval;
}

function validateDomain(domain: string, validTld: string[]): boolean {
    const tld = domain.split('.').pop()?.toUpperCase();
    if (tld && validTld.includes(tld)) return true;
    return false;
}

function removeArrayDuplicates(array: any[]): any[] {
    /**
     * removes duplicates from the passed array.
     * @param array 
     * @returns the array with duplicates removed
     */
    return array.filter((item, index) => {
        return array.indexOf(item) === index;
    });
}