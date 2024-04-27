import { request, RequestUrlParam } from "obsidian";

export { vtDomain, vtHash, vtIp }

interface ApiVals {
    baseUrl: string,
    iocType: string | string[],
    queryString?: Record<string, string>
}

export const VT_IP: ApiVals = {
    baseUrl: "https://www.virustotal.com/api/v3/ip_addresses/",
    iocType: "ip"
}

export const VT_HASH: ApiVals = {
    baseUrl: "https://www.virustotal.com/api/v3/files/",
    iocType: "hash"
}

export const VT_DOMAIN: ApiVals = {
    baseUrl: "https://www.virustotal.com/api/v3/domains/",
    iocType: "domain"
}

async function vtCall(url: string, key: string): Promise<JSON> {
    const headers = {"x-apikey": key};
    const vtParams = {url: url, headers: headers, throw: true} as RequestUrlParam;
    const data = await request(vtParams);
    return JSON.parse(data).data.attributes;
}

async function vtDomain(val: string, key: string): Promise<JSON> {
    const url = VT_DOMAIN.baseUrl + val;
    return await vtCall(url, key);
}

async function vtHash(val: string, key: string): Promise<JSON> {
    const url = VT_HASH.baseUrl + val;
    return await vtCall(url, key);
}

async function vtIp(val: string, key: string): Promise<JSON> {
    const url = VT_IP.baseUrl + val;
    return await vtCall(url, key);
}