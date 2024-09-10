<script lang="ts">
    import { type ParsedIndicators } from "../utils";
    
    import Item from "./Item.svelte";
	import Button from "./Button.svelte";

    export let indicatorList: ParsedIndicators;
    let multisearchLinks = new Map<string, string>();
    $: indicatorList.sites?.forEach((site) => {
        console.log(`checking multisearch for ${site.shortName}`)
        if (site.multisearch && indicatorList.items.length > 1) {
            indicatorList.items.forEach((item) => {
                if (!multisearchLinks.has(site.shortName)) {
                    multisearchLinks.set(site.shortName, site.site.replace('%s', item));
                } else {
                    const url = multisearchLinks.get(site.shortName);
                    if (!url) {
                        multisearchLinks.set(site.shortName, site.site.replace('%s', item));
                    } else if (!url.includes(item)) {
                        multisearchLinks.set(site.shortName, url + site.separator + item);
                    }
                    console.log(`added ${item} to ${site.shortName}`);
                    console.log(multisearchLinks.get(site.shortName));
                }
            })
        }
    })
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
                            {#if site.multisearch && multisearchLinks.has(site.shortName)}
                                <Button 
                                    href={multisearchLinks.get(site.shortName)}
                                    title={`Multisearch ${site.shortName}`}
                                />
                            {/if}
                        {/each}
                </tr>
            </table>
        </div>
    {/if}
</details>