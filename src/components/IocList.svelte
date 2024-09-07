<script lang="ts">
    import { vtSearch } from "src/utils";
    
    import Item from "./Item.svelte";

    export let iocList: string[];
    export let title: string;

    const searchSites = [vtSearch]
</script>

<details class="sidebar-container tree-item" open>
    <summary class="tree-item-inner">{title}</summary>
    <div class="tree-item-children">
        {#each iocList as item}
            <Item item={item} buttons={searchSites}/>
        {/each}
    </div>
</details>