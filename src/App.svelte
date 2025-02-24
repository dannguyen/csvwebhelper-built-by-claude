<script>
  import { onMount } from 'svelte';
  import CSVWebHelper from './lib/CSVWebHelper.svelte';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<main>
  {#if mounted}
    <CSVWebHelper />
  {/if}
</main>