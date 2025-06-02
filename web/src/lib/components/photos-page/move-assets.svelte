<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { type OnMove, moveAssets } from '$lib/utils/actions';
  import { mdiDeleteForeverOutline, mdiDeleteOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import MoveAssetDialog from '../move-asset-dialog.svelte';

  interface Props {
    onAssetMove: OnMove;
    menuItem?: boolean;
    tree: any;
  }

  let { onAssetMove, menuItem = false, tree }: Props = $props();

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowConfirmation = $state(false);
  let loading = $state(false);

  let label = $derived($t('move'));

  const handleMoveClick = () => {
    isShowConfirmation = true;
  };

  const handleMoveConfirmed = async (newFolderPath: string) => {
    loading = true;
    const ids = [...getOwnedAssets()].map((a) => a.id);
    console.log('Move assets to:', newFolderPath);
    await moveAssets(onAssetMove, ids, newFolderPath);

    clearSelect();
    isShowConfirmation = false;
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption text={label} icon={mdiDeleteOutline} onClick={handleMoveClick} />
{:else if loading}
  <CircleIconButton title={$t('loading')} icon={mdiTimerSand} onclick={() => {}} />
{:else}
  <CircleIconButton title={label} icon={mdiDeleteForeverOutline} onclick={handleMoveClick} />
{/if}

{#if isShowConfirmation}
  <MoveAssetDialog
    size={getOwnedAssets().length}
    {tree}
    onConfirm={handleMoveConfirmed}
    onCancel={() => (isShowConfirmation = false)}
  />
{/if}
