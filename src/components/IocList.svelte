<script lang="ts">
    import { vtSearch, type ParsedIndicators } from "src/utils";
    
    import Item from "./Item.svelte";

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
</details>