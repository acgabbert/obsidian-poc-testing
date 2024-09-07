<script lang="ts">
    import IocList from "./IocList.svelte";
    //export let iocList: string[];
    const iocListTitles = ["IPs", "Domains", "Hashes"];
    const iocs = ["8.8.8.8", "9.9.9.9"];
</script>

<h4>Extracted Indicators</h4>
{#each iocListTitles as title}
    <IocList title={title} iocList={iocs}/>
{/each}