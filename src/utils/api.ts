import { App, Notice, type RequestUrlParam, TFile, request } from "obsidian";
import { appendToEnd } from "./editorUtils";
import type { VtResponse } from "./vt";

export { apiRequest, appendResult }

export type ApiVals = {
    baseUrl: string,
    iocType: string | string[],
    queryString?: Record<string, string>,
    headers?: Record<string, string>
}

export const loadingMessage = 'Loading... ⏳';
export const loadingMessage2 = 'Loading... ⌛';

async function apiRequest(vals: ApiVals, val: string, key: string): Promise<VtResponse> {
    const headers = {'x-apikey': key};
    const vtParams = {url: vals.baseUrl + val, headers: headers, throw: true} as RequestUrlParam;
    const data = await request(vtParams);
    return JSON.parse(data).data as Promise<VtResponse>;
}

async function appendResult(result: Promise<VtResponse>, app: App, file: TFile) {
    const loading = new Notice("Loading results... ⏳", 0);
    result.then((data: VtResponse) => {
        loading.hide();
        console.log(`appending content to ${file.name}`);
        appendToEnd(app, file, `\`\`\`ApiResult\n${data.type}\n\`\`\``);
    }, (err) => {
        loading.hide();
        new Notice("Error calling API.");
        console.log(err);
    })
}