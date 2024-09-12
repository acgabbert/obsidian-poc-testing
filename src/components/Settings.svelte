<script lang="ts">
    //export let iocList: string[];
    export let settings: boolean[];
</script>

<h4>Extracted Indicators</h4>
{#each settings as setting}
    <div>
        <input type="checkbox" id="test" checked={setting}>
        <label for="test">TEST!!</label>
    </div>
{/each}