import { apiRequest, ApiVals } from "./api";

export { virusTotal };

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

export const VT_ENT_SEARCH: ApiVals = {
    baseUrl: "https://www.virustotal.com/api/v3/search/",
    iocType: ["ip", "hash", "domain"],
    queryString: {"query": ""}
}

async function virusTotal(vals: ApiVals, val: string, key: string): Promise<VtResponse> {
    const resp = await apiRequest(vals, val, key) as VtResponse;
    return resp;
}

export type VtResponse = {
    id: string
    type: string
    links: Record<string, string>
    attributes: VtAttributes
}

export interface VtFileResponse extends VtResponse {
    attributes: VtFileAttributes
}

export interface VtDomainResponse extends VtResponse {
    attributes: VtDomainAttributes
}

export interface VtIpResponse extends VtResponse {
    attributes: VtIpAttributes
}

interface VtAttributes {
    total_votes: Record<string, number>
    last_analysis_date?: number
    last_analysis_results: Record<string, VtAnalysisResult>
    last_analysis_stats: Record<string, number>
}

export interface VtFileAttributes extends VtAttributes {
    crowdsourced_yara_results: YaraResult[]
    md5: string
    names: string[]
    packers: Record<string, string>
    sha1: string
    sha256: string
    size: number
    tags: string[]
    type_tag: string
    type_tags: string[]
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
    last_https_certificate: Record<string, unknown>
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

type YaraResult = {
    ruleset_id: string
    rule_name: string
    ruleset_name: string
    description: string
    author: string
    source: string
}

export interface VtIpAttributes extends VtAttributes {
    
}