<script lang="ts">
  import InputBox from '$lib/components/elements/inputbox.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { createSitesUrl, updateSitesUrl, type SitesUrlCreateDto, type SitesUrlUpdateDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    newSiteUrl?: SitesUrlCreateDto;
    updateSiteUrl?: SitesUrlUpdateDto;
    isNew?: boolean;
    id?: string;
    onClose: (siteUrlUpdated?: SitesUrlCreateDto) => void;
  }

  let { newSiteUrl, updateSiteUrl, isNew = false, id, onClose }: Props = $props();

  // Use newSiteUrl or updateSiteUrl depending on isNew, fallback to empty object to avoid undefined
  const siteUrlData = isNew ? (newSiteUrl ?? {}) : (updateSiteUrl ?? {});

  let url = $state(siteUrlData.url ?? '');
  let posts = $state<number>(siteUrlData.posts ?? 0);
  let description = $state(siteUrlData.description ?? '');
  let preference = $state(siteUrlData.preference ?? 1);
  let failed = $state(siteUrlData.failed ?? false);
  let lastDownloadedNode = $state(siteUrlData.lastDownloadedNode ?? '');

  const submitUrl = async () => {
    try {
      const dto: SitesUrlCreateDto | SitesUrlUpdateDto = {
        url,
        posts: +posts,
        description,
        preference,
        failed,
        lastDownloadedNode,
      };

      console.log('Submitting URL:', dto);
      console.log('id:', id);
      const updatedSiteUrl = isNew
        ? await createSitesUrl(dto as SitesUrlCreateDto)
        : await updateSitesUrl(id, { ...(updateSiteUrl ?? {}), ...dto });

      notificationController.show({
        message: $t('url_saved'),
        type: NotificationType.Info,
      });

      onClose(updatedSiteUrl);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_description'));
    }
  };
</script>

<Modal title={$t('edit_url')} icon={mdiCake} {onClose} size="medium">
  <ModalBody>
    <div class="text-immich-primary dark:text-immich-dark-primary">
      <p class="text-sm dark:text-immich-dark-fg">{$t('url_data')}</p>
    </div>

    <form on:submit|preventDefault={submitUrl} autocomplete="off" id="set-description-form">
      <div class="my-4 flex flex-col gap-2">
        <InputBox
          class="immich-form-input"
          id="url"
          name="url"
          type="text"
          label="Url"
          bind:value={url}
          placeholder="Enter url"
          multiline={false}
        />

        <InputBox
          class="immich-form-input"
          id="posts"
          name="posts"
          type="number"
          label="Posts"
          bind:value={posts}
          placeholder="Enter Posts"
          multiline={false}
        />

        <InputBox
          class="immich-form-input"
          id="description"
          name="description"
          type="text"
          label="Description"
          bind:value={description}
          placeholder="Enter Description"
          multiline={true}
        />

        <label class="flex flex-col gap-2">
          <span>Preference</span>
          <select bind:value={preference} class="border p-2 rounded-md">
            {#each [1, 2, 3, 4, 5] as num}
              <option value={num}>{num}</option>
            {/each}
          </select>
        </label>

        <label class="flex items-center gap-2">
          <input type="checkbox" bind:checked={failed} />
          <span>Failed</span>
        </label>

        <InputBox
          class="immich-form-input"
          id="lastDownloadedNode"
          name="lastDownloadedNode"
          type="text"
          label="Last Downloaded Node"
          bind:value={lastDownloadedNode}
          placeholder="Enter Last Downloaded Node"
          multiline={false}
        />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="secondary" fullWidth on:click={() => onClose()}>
        {$t('cancel')}
      </Button>
      <Button type="submit" shape="round" color="primary" fullWidth form="set-description-form">
        {$t('save')}
      </Button>
    </div>
  </ModalFooter>
</Modal>
