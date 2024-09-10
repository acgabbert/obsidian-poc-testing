<script lang="ts">
    import Button from "./Button.svelte";
	import type { searchSite } from "../utils";

    export let item: string;
    export let buttons: searchSite[] | undefined;
</script>

<div class="sidebar-list-item tree-item-self">
    <div class="tree-item-inner">{item}</div>
</div>
{#if buttons}
    <div class="table-container">
        <table>
            <tr class="sidebar-table-row">
                    {#each buttons as button}
                        <Button href={button.site.replace('%s', item)} title={button.shortName}/>
                    {/each}
            </tr>
        </table>
    </div>
{/if}