<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import ConfirmModal from '$lib/modals/ConfirmModal.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { Checkbox, Label } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    size: number;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { size, onConfirm, onCancel }: Props = $props();

  let checked = $state(false);

  const handleConfirm = () => {
    if (checked) {
      $showDeleteModal = false;
    }
    onConfirm();
  };
</script>

<ConfirmModal
  title={$t('move_assets', { values: { count: size } })}
  confirmText={$t('move')}
  onClose={(confirmed) => (confirmed ? handleConfirm() : onCancel())}
>
  {#snippet promptSnippet()}
    <p>
      <FormatMessage key="move_assets_prompt" values={{ count: size }}>
        {#snippet children({ message })}
          <b>{message}</b>
        {/snippet}
      </FormatMessage>
    </p>
    <p><b>{$t('cannot_undo_this_action')}</b></p>

    <div class="pt-4 flex justify-center items-center gap-2">
      <Checkbox id="confirm-move-input" bind:checked color="secondary" />
      <Label label={$t('do_not_show_again')} for="confirm-move-input" />
    </div>
  {/snippet}
</ConfirmModal>
