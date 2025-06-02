<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';

  import InputBox from '$lib/components/elements/inputbox.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { type PersonResponseDto, getCountries, updatePerson } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { derived, writable } from 'svelte/store';
  import ImageThumbnail from '../components/assets/thumbnail/image-thumbnail.svelte';
  import DateInput from '../components/elements/date-input.svelte';

  interface Props {
    person: PersonResponseDto;
    suggestedPeople: PersonResponseDto[];
    isSearchingPeople: boolean;
    onClose: (updatedPerson?: PersonResponseDto) => void;
  }

  let { person, suggestedPeople = $bindable(), isSearchingPeople = $bindable(), onClose }: Props = $props();

  let name = $state(person.name);
  let description = $state(person.description ?? '');
  let birthDate = $state(person.birthDate ?? '');
  let age = $state(person.age ?? 0);
  let country = $state(person.country ?? '');
  let city = $state(person.city ?? '');
  let height = $state(person.height ?? 0);
  let socialMedia = $state(person.socialMedia ?? []);
  let relationships = $state(person.relationships ?? []);

  let thumbnailData = $state(getPeopleThumbnailUrl(person));

  let personToMerge: PersonResponseDto | undefined = $state();
  let personToBeMergedInto: PersonResponseDto | undefined = $state();
  let potentialMergePeople: PersonResponseDto[] = $state([]);

  let errors: Record<string, string> = $state({});

  let loading = writable(true); // Track loading state with writable store
  let countries = writable<{ code: string; name: string }[]>([]); // Use writable store for countries

  const handleUpdatePerson = async (event: Event) => {
    try {
      event.preventDefault();
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        errors = validationErrors;
        return;
      }
      errors = {}; // clear errors

      const updatedPerson = await updatePerson({
        id: person.id,
        personUpdateDto: {
          name,
          description,
          birthDate: birthDate === '' ? null : birthDate,
          age: age > 0 ? age : null,
          country,
          city,
          height: height > 0 ? height : null,
        },
      });

      notificationController.show({ message: $t('date_of_birth_saved'), type: NotificationType.Info });
      onClose(updatedPerson);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_date_of_birth'));
    }
  };

  onMount(async () => {
    try {
      const response = await getCountries({ locale: 'en' });
      const data = response;

      const countryData = data.map((entry: string) => {
        const [code, name] = entry.split(' - ');
        return { code, name };
      });

      countries.set(countryData); // Set countries to the writable store
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      loading.set(false); // Set loading to false when finished
    }
  });

  const todayFormatted = new Date().toISOString().split('T')[0];

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim() === '') {
      newErrors.name = 'Name is required.';
    }

    if (!birthDate || Number.isNaN(Date.parse(birthDate))) {
      newErrors.birthDate = 'Invalid birth date.';
      age = 0;
    }

    if (!birthDate && age && Number.isNaN(Number(age))) {
      newErrors.age = 'Age must be a number.';
      birthDate = '';
    }

    if (height && Number.isNaN(Number(height))) {
      newErrors.height = 'Height must be a number.';
    }

    return newErrors;
  }

  const derivedCountries = derived(countries, ($countries) => $countries);
</script>

<Modal title={$t('set_date_of_birth')} icon={mdiCake} {onClose} size="large">
  <ModalBody>
    <!-- Thumbnail centered -->
    <div class="flex justify-center items-center my-4">
      <ImageThumbnail circle shadow url={thumbnailData} altText={person.name} widthStyle="10rem" heightStyle="10rem" />
    </div>

    <form
      onsubmit={(event) => handleUpdatePerson(event)}
      autocomplete="off"
      id="set-person-data-form"
      class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4"
    >
      <!-- Left Column -->
      <div class="flex flex-col w-full gap-4">
        <!-- Name -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Name:</label>
        <div
          class="flex w-full h-14 place-items-center {suggestedPeople.length > 0
            ? 'rounded-t-lg dark:border-immich-dark-gray'
            : 'rounded-lg'}  bg-gray-100 p-2 dark:bg-gray-700 border border-gray-200 dark:border-immich-dark-gray"
        >
          <SearchPeople
            bind:searchName={name}
            bind:searchedPeopleLocal={suggestedPeople}
            type="input"
            numberPeopleToSearch={5}
            inputClass="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
            bind:showLoadingSpinner={isSearchingPeople}
          />
          <Button size="small" shape="round" type="submit">{$t('done')}</Button>
        </div>

        <!-- BirthDate -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">BirthDate: {birthDate} </label>
        <DateInput
          class="immich-form-input"
          id="birthDate"
          name="birthDate"
          type="date"
          bind:value={birthDate}
          max={todayFormatted}
        />

        <!-- Age -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Age:</label>
        <div
          class="flex items-center w-full bg-gray-100 dark:bg-gray-700 p-2 border border-gray-200 dark:border-immich-dark-gray rounded-lg"
        >
          <InputBox
            id="age"
            type="text"
            bind:value={age}
            placeholder="Enter age"
            inputClass="w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Country -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Country:</label>
        <div
          class="w-full bg-gray-100 dark:bg-gray-700 p-2 border border-gray-200 dark:border-immich-dark-gray rounded-lg"
        >
          {#if $loading}
            <p>Loading...</p>
          {:else}
            <select class="w-full bg-gray-100 dark:bg-gray-700 dark:text-white" bind:value={country}>
              <option value="" disabled selected>Select a country</option>
              {#each $derivedCountries as { code, name } (code)}
                <option value={code}>{name}</option>
              {/each}
            </select>
          {/if}
        </div>

        <!-- City -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">City:</label>
        <InputBox
          id="city"
          type="text"
          bind:value={city}
          placeholder="Enter city"
          inputClass="w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
        />

        <!-- Height -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Height:</label>
        <InputBox
          id="height"
          type="text"
          bind:value={height}
          placeholder="Enter height"
          inputClass="w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
        />

        <!-- Description -->
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Description:</label>
        <InputBox
          id="description"
          type="text"
          bind:value={description}
          placeholder="Enter details"
          inputClass="w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
          multiline={true}
        />
      </div>

      <!-- Right Column: Social Media -->
      <div class="flex flex-col gap-2">
        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Social Media:</label>
        {#each socialMedia as sm, index (index)}
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <InputBox
              id={`socialMedia-${index}`}
              type="text"
              bind:value={sm.url}
              placeholder="Enter social media URL"
              inputClass="w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
            />
            <Button
              color="secondary"
              onclick={() => (socialMedia = socialMedia.filter((_, i) => i !== index))}
              class="self-end sm:self-auto"
            >
              Remove
            </Button>
          </div>
        {/each}

        <Button
          color="secondary"
          onclick={() => (socialMedia = [...socialMedia, { id: '', platform: '', platformUserId: '', url: '' }])}
          class="self-start"
        >
          Add Social Media
        </Button>

        <label class="text-sm text-immich-primary dark:text-immich-dark-primary">Related People:</label>
        {#each relationships as relationship, index (index)}
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <InputBox
              id={`relationship-${index}`}
              type="text"
              bind:value={relationship.relatedPerson.name}
              placeholder="Enter related person's name"
              inputClass="w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
            />
            <Button
              color="secondary"
              onclick={() => (relationships = relationships.filter((_, i) => i !== index))}
              class="self-end sm:self-auto"
            >
              Remove
            </Button>
          </div>
        {/each}
        <Button
          color="secondary"
          onclick={() =>
            (relationships = [
              ...relationships,
              {
                personId: '',
                relatedPersonId: '',
                type: '',
                direction: 'asSource',
                relatedPerson: { id: '', name: '', birthDate: null, age: null, thumbnailPath: '' },
              },
            ])}
          class="self-start"
        >
          Add Related Person
        </Button>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>
        {$t('cancel')}
      </Button>
      <Button type="submit" shape="round" color="primary" fullWidth form="set-person-data-form">
        {$t('save')}
      </Button>
    </div>
  </ModalFooter>
</Modal>
