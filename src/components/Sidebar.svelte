<script lang="ts">
	import type { ParsedIndicators } from "src/utils";
    import IocList from "./IocList.svelte";
    //export let iocList: string[];
    export let indicators: ParsedIndicators[];
    const iocListTitles = ["IPs", "Domains", "Hashes"];
    const iocs = ["8.8.8.8", "9.9.9.9"];
</script>

<h4>Extracted Indicators</h4>
{#each indicators as indicatorList}
    <IocList indicatorList={indicatorList}/>
{/each}