import { RequestUrlParam, request } from "obsidian";

export { apiRequest }

export type ApiVals = {
    baseUrl: string,
    iocType: string | string[],
    queryString?: Record<string, string>,
    headers?: Record<string, string>
}

async function apiRequest(vals: ApiVals, val: string, key: string): Promise<Object> {
    const headers = {'x-apikey': key};
    const vtParams = {url: vals.baseUrl + val, headers: headers, throw: true} as RequestUrlParam;
    const data = await request(vtParams);
    return JSON.parse(data).data;
}