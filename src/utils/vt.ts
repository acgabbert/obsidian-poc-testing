import { request, RequestUrlParam } from "obsidian";

export { virusTotal };

interface ApiVals {
    baseUrl: string,
    iocType: string | string[],
    queryString?: Record<string, string>,
    headers?: Record<string, string>
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

async function virusTotal(vals: ApiVals, val: string, key: string): Promise<JSON> {
    const headers = {'x-apikey': key};
    const vtParams = {url: vals.baseUrl + val, headers: headers, throw: true} as RequestUrlParam;
    const data = await request(vtParams);
    return JSON.parse(data).data;
}

export type VtResponse = {
    id: string
    type: string
    links: Record<string, string>
    attributes: VtDomainAttributes
}

interface VtAttributes {
    total_votes: Record<string, number>
    last_analysis_date?: number
    last_analysis_results: Record<string, VtAnalysisResult>
    last_analysis_stats: Record<string, number>
}

export interface VtFileAttributes extends VtAttributes {
    packers: Record<string, string>
}

export interface VtDomainAttributes extends VtAttributes {
    total_votes: Record<string, number>
    jarm: string
    whois_date: number
    tld: string
    last_dns_records: Array<VtDnsRecord>
    last_https_certificate_date: number
    categories: Record<string, string>
    whois: string
    popularity_ranks: Record<string, VtDomainPopularity>
    last_dns_records_date: number
    last_https_certificate: Record<string, Object>
    creation_date: number
}

type VtDnsRecord = {
    type: string
    ttl: number
    value: string
}

type VtAnalysisResult = {
    method: string
    engine_name: string
    engine_version?: string
    engine_update?: string
    category: string
    result: string
}

type VtDomainPopularity = {
    timestamp: number
    rank: number
}