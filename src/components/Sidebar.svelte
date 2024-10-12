<script lang="ts">
	import type { ParsedIndicators } from "obsidian-cyber-utils";
    import { IocList } from "obsidian-svelte-components";
    import OcrIndicators from "./OcrIndicators.svelte";
    export let indicators: ParsedIndicators[];
    export let ocrIndicators: Promise<ParsedIndicators[]> | undefined;
</script>

<h4>Extracted Indicators</h4>
{#each indicators as indicatorList}
    {#if indicatorList.items.length > 0}
        <IocList indicatorList={indicatorList}/>
    {/if}
{/each}
{#if ocrIndicators}
<OcrIndicators indicators={ocrIndicators}/>
{/if}