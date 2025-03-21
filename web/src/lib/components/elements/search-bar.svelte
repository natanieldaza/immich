<script lang="ts">
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import type { SearchOptions } from '$lib/utils/dipatch';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    name: string;
    roundedBottom?: boolean;
    showLoadingSpinner: boolean;
    placeholder: string;
    onSearch?: (options: SearchOptions) => void;
    onReset?: () => void;
  }

  let {
    name = $bindable(),
    roundedBottom = true,
    showLoadingSpinner,
    placeholder,
    onSearch = () => {},
    onReset = () => {},
  }: Props = $props();

  let inputRef = $state<HTMLElement>();

  const resetSearch = () => {
    name = '';
    onReset();
    inputRef?.focus();
  };

  const handleSearch = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch({ force: true });
    }
  };
</script>

<div
  class="flex items-center text-sm {roundedBottom
    ? 'rounded-2xl'
    : 'rounded-t-lg'} bg-gray-200 p-2 dark:bg-immich-dark-gray gap-2 place-items-center h-full"
>
  <CircleIconButton
    icon={mdiMagnify}
    title={$t('search')}
    size="16"
    padding="2"
    onclick={() => onSearch({ force: true })}
  />
  <input
    class="w-full gap-2 bg-gray-200 dark:bg-immich-dark-gray dark:text-white"
    type="text"
    {placeholder}
    bind:value={name}
    bind:this={inputRef}
    onkeydown={handleSearch}
    oninput={() => onSearch({ force: false })}
  />
  {#if showLoadingSpinner}
    <div class="flex place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
  {#if name}
    <CircleIconButton icon={mdiClose} title={$t('clear_value')} size="16" padding="2" onclick={resetSearch} />
  {/if}
</div>
