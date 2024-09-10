<script lang="ts">
    import { vtSearch, type ParsedIndicators } from "../utils";
    
    import Item from "./Item.svelte";
	import Button from "./Button.svelte";

    export let indicatorList: ParsedIndicators;

    const searchSites = [vtSearch]
</script>

<details class="sidebar-container tree-item" open>
    <summary class="tree-item-inner">{indicatorList.title}</summary>
    <div class="tree-item-children">
        {#each indicatorList.items as item}
            <Item item={item} buttons={indicatorList.sites}/>
        {/each}
    </div>
    {#if indicatorList.sites}
        <div class="table-container">
            <table>
                <tr class="sidebar-table-row">
                        {#each indicatorList.sites as site}
                            {#if site.multisearch}
                                <Button 
                                    href={site.site.replace('%s', indicatorList.items[0])} 
                                    title={`Multisearch ${site.shortName}`}
                                />
                            {/if}
                        {/each}
                </tr>
            </table>
        </div>
    {/if}
</details>