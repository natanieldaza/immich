<script lang="ts">
  import { Button, Checkbox, Label, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCake, mdiFolder, mdiFolderOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  import { showMoveModal } from '$lib/stores/preferences.store';

  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import type { RecursiveObject } from '$lib/utils/tree-utils';
  export interface TreeNode {
    id: string;
    name: string;
    children?: RecursiveObject;
  }

  interface Props {
    size: number;
    onConfirm: (newFolderPath: string) => void;
    onCancel: () => void;
    onClose: () => void;
    tree: RecursiveObject;
  }

  const { size, onConfirm, onCancel, onClose, tree: incomingTree }: Props = $props(); // Single $props() call

  let tree = $state(incomingTree); // Initialize tree with incomingTree

  let checked = $state(false);

  let selectedFolderId: string | null = null;
  let expandedFolders = new Set<string>();
  let creatingFolderUnderId: string | null = null;
  let newFolderName = '';
  let folderPath = $state('');

  const handleConfirm = () => {
    if (checked) {
      $showMoveModal = false;
    }
    if (folderPath) {
      onConfirm(folderPath);
    } else {
      onCancel();
    }
  };

  const getLink = (path: string) => {
    folderPath = path;
    return '#';
  };
</script>

<Modal title={$t('set_date_of_birth')} icon={mdiCake} {onClose} size="large">
  <ModalBody>
    <form
      on:submit|preventDefault={handleConfirm}
      autocomplete="off"
      id="move-assets-form"
      class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4"
    >
      <div class="space-y-2">
        <!-- Folder Tree -->
        <div class="max-h-64 overflow-auto border p-2 rounded bg-gray-50 dark:bg-gray-800">
          <div class="p-2 bg-black-200 dark:bg-gray-700 rounded">
            <TreeItems
              icons={{ default: mdiFolderOutline, active: mdiFolder }}
              items={tree}
              active={newFolderName}
              {getLink}
              isMenu={true}
              currentPath={folderPath}
            />
          </div>
        </div>
        <div class="flex items-center justify-center">
          <label> path : {folderPath}</label>
        </div>
        <!-- Checkbox -->

        <div class="pt-4 flex justify-center items-center">
          <Checkbox id="confirm-move-input" size="tiny" bind:checked />
          <Label label={$t('do_not_show_again')} for="confirm-move-input" />
        </div>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>
        {$t('cancel')}
      </Button>
      <Button type="submit" shape="round" color="primary" fullWidth form="move-assets-form">
        {$t('save')}
      </Button>
    </div>
  </ModalFooter>
</Modal>

<style>
  .selected {
    background-color: #cfe8ff;
  }
</style>
