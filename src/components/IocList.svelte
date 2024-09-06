<script lang="ts">
    export let iocList: string[];
    export let title: string;
</script>

<details class="sidebar-container tree-item" open>
    <summary class="tree-item-inner">{title}</summary>
    <div class="tree-item-children">
        {#each iocList as item}
            <div class="sidebar-list-item tree-item-self">
                <div class="tree-item-inner">{item}</div>
            </div>
        {/each}
    </div>
</details>