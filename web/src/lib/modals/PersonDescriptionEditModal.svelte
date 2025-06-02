<script lang="ts">
  import InputBox from '$lib/components/elements/inputbox.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { updatePerson, type PersonResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    person: PersonResponseDto;
    onClose: (updatedPerson?: PersonResponseDto) => void;
  }

  let { person, onClose }: Props = $props();

  let description = $state(person.description ?? '');

  const submitDescriptionChange = async () => {
    try {
      const updatedPerson = await updatePerson({
        id: person.id,
        personUpdateDto: { description },
      });

      notificationController.show({
        message: $t('description_saved'),
        type: NotificationType.Info,
      });
      // Update the person object with the new description
      onClose(updatedPerson);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_description'));
    }
  };
</script>

<Modal title={$t('set_date_of_birth')} icon={mdiCake} {onClose} size="medium">
  <ModalBody>
    <div class="text-immich-primary dark:text-immich-dark-primary">
      <p class="text-sm dark:text-immich-dark-fg">
        {$t('description_set_description')}
      </p>
    </div>

    <form onsubmit={() => submitDescriptionChange()} autocomplete="off" id="set-description-form">
      <div class="my-4 flex flex-col gap-2">
        <InputBox
          class="immich-form-input"
          id="description"
          name="description"
          type="text"
          label="Description"
          bind:value={description}
          placeholder="Enter details"
          multiline={true}
        />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>
        {$t('cancel')}
      </Button>
      <Button type="submit" shape="round" color="primary" fullWidth form="set-description-form">
        {$t('save')}
      </Button>
    </div>
  </ModalFooter>
</Modal>
