<script lang="ts">
  import { goto } from '$app/navigation';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createSitesUrl,
    deleteSitesUrl,
    getAllSitesUrl,
    type SitesUrlCreateDto,
    type SitesUrlResponseDto,
    type SitesUrlUpdateDto,
    updateSitesUrl,
  } from '@immich/sdk';
  import { mdiEyeOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { writable } from 'svelte/store';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const urls = writable<SitesUrlResponseDto[]>(data.urls);

  let search = $state('');
  let sortKey: keyof SitesUrlResponseDto = 'createdAt';
  let sortAsc = true;
  let pager = $state(1);
  let pageSize = 10;
  let showEditModal = $state(false);
  let isNew = false;
  let editingItem: SitesUrlCreateDto | SitesUrlResponseDto | null = null;
  let inlineEditingId: string | null = null;

  async function fetchData() {
    try {
      const response = await getAllSitesUrl();
      $urls = response; // ✅ update reactive store properly
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  }

  function getFiltered() {
    return $urls
      .filter((item) =>
        Object.values(item)
          .filter((v) => v != null)
          .some((v) => v!.toString().toLowerCase().includes(search.toLowerCase())),
      )
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return sortAsc ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
      });
  }

  function getPaginated() {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / pageSize);
    console.log(`Total pages: ${totalPages}, Current page: ${pager}`);
    return filtered.slice((pager - 1) * pageSize, pager * pageSize);
  }

  function toggleSort(key: keyof SitesUrlResponseDto) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = true;
    }
    pager = 1;
  }

  onMount(async () => {
    $urls = await getAllSitesUrl();
  });

  function openCreateModal() {
    editingItem = {
      url: 'https://',
      description: '',
      preference: 3, // default preference
      posts: 0, // default posts
    };
    isNew = true;
    showEditModal = true;
  }

  function openEditModal(item: SitesUrlResponseDto) {
    editingItem = { ...item };
    isNew = false;
    showEditModal = true;
  }

  async function saveModal() {
    try {
      const payload = {
        ...editingItem,
        url: editingItem.url.trim(),
        description: editingItem.description?.trim() ?? null,
        preference: Number(editingItem.preference) || 1,
        posts: editingItem.posts || 0, // default to 0 if not provided
      };

      if (!payload.url || typeof payload.url !== 'string' || !payload.url.startsWith('http')) {
        alert('Please enter a valid URL');
        return;
      }
      if (payload.preference < 1 || payload.preference > 5) {
        alert('Preference must be a number between 1 and 5');
        return;
      }

      if (isNew) {
        try {
          await createSitesUrl({
            sitesUrlCreateDto: {
              url: payload.url,
              description: payload.description,
              preference: payload.preference,
              posts: payload.posts || 0, // default to 0 if not provided
            },
          });
        } catch (error) {
          handleError(error, 'Failed to create site URL');
          return;
        }
      } else {
        const updatePayload = Object.fromEntries(
          Object.entries({
            url: payload.url,
            description: payload.description,
            preference: payload.preference,
            posts: payload.posts,
          }).filter(([_, v]) => v !== undefined),
        );

        try {
          await updateSitesUrl({
            id: editingItem.id,
            sitesUrlUpdateDto: {
              ...updatePayload,
            },
          });
        } catch (error) {
          handleError(error, 'Failed to update site URL');
          return;
        }
      }

      showEditModal = false;
      await fetchData(); // ✅ this now correctly updates $urls
    } catch (err) {
      console.error('Unexpected error:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Failed to save URL entry',
      });
    }
  }

  async function deleteRow(id: string) {
    await deleteSitesUrl({ id });
    await fetchData(); // ✅ properly updates UI
    pager = 1;
  }

  async function saveInlineEdit(item: SitesUrlResponseDto) {
    inlineEditingId = null;
    try {
      const payload: SitesUrlUpdateDto = {
        url: item.url,
        posts: item.posts,
        description: item.description,
        preference: Number(item.preference),
      };

      if (payload.preference < 1 || payload.preference > 5) {
        throw new Error('Preference must be between 1 and 5');
      }

      const updated = await updateSitesUrl({ id: item.id, sitesUrlUpdateDto: payload });

      $urls = $urls.map((u) => (u.id === updated.id ? updated : u));
    } catch (err) {
      console.error('Inline update failed', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Inline update failed',
      });
    }
  }
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape') showEditModal = false;
  }}
/>
<UserPageLayout
  title={$t('user.sites-url.title')}
  description={$t('user.sites-url.description')}
  icon={mdiEyeOutline}
  class="p-4"
  use={[[scrollMemory, { routeStartsWith: AppRoute.SITES_URL }], [focusTrap]]}
  on:close={() => {
    goto(AppRoute.SITES_URL);
  }}
>
  <!-- Search -->
  <input type="text" bind:value={search} placeholder="Search..." class="p-2 border rounded mb-4 w-full" />

  <!-- Responsive Table -->
  <div class="w-full">
    <!-- Desktop Table -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="min-w-full border border-collapse text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('url')}>URL</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('posts')}>POSTS</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('description')}>Description</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('createdAt')}>Created</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('visitedAt')}>Visited</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('preference')}>Preference</th>
            <th class="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each getPaginated() as item}
            <tr class="border-t hover:bg-gray-50">
              <td class="p-2 break-words">{item.url}</td>
              <td class="p-2">{item.posts ?? '-'}</td>
              <td class="p-2 break-words">{item.description ?? '-'}</td>
              <td class="p-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
              <td class="p-2">{item.visitedAt ? new Date(item.visitedAt).toLocaleString() : '-'}</td>
              <td class="p-2">{item.preference ?? '-'}</td>
              <td class="p-2 flex flex-col sm:flex-row gap-2">
                <button on:click={() => openEditModal(item)}>Edit</button>
                <button on:click={() => deleteRow(item.id)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="block sm:hidden space-y-4">
      {#each getPaginated() as item}
        <div class="border rounded p-4 shadow-sm">
          <div class="mb-2">
            <strong>URL:</strong>
            <div class="break-words">{item.url}</div>
          </div>
          <div class="mb-2">
            <strong>POSTS:</strong>
            <div class="break-words">{item.posts ?? 0}</div>
          </div>
          <div class="mb-2">
            <strong>Description:</strong>
            <div class="break-words">{item.description ?? '-'}</div>
          </div>
          <div class="mb-2">
            <strong>Created:</strong>
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
          </div>
          <div class="mb-2">
            <strong>Visited:</strong>
            {item.visitedAt ? new Date(item.visitedAt).toLocaleString() : '-'}
          </div>
          <div class="mb-2"><strong>Preference:</strong> {item.preference ?? '-'}</div>
          <div class="flex flex-col gap-2 mt-4">
            <button on:click={() => openEditModal(item)}>Edit</button>
            <button on:click={() => deleteRow(item.id)}>Delete</button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Pagination Controls -->
  <div class="mt-4 flex items-center justify-between">
    <button on:click={() => (pager = Math.max(1, pager - 1))} disabled={pager === 1}>Previous</button>
    <span>Page {pager}</span>
    <button on:click={() => (pager += 1)} disabled={pager * pageSize >= getFiltered().length}>Next</button>
  </div>

  <!-- Create Button -->
  <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded" on:click={openCreateModal}>Add New</button>

  <!-- Modal -->
  {#if showEditModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded shadow w-full max-w-md space-y-4">
        <h3 class="text-lg font-bold">{isNew ? 'Add New URL' : 'Edit URL'}</h3>

        <input class="w-full border p-2" placeholder="URL" bind:value={editingItem.url} />
        <input class="w-full border p-2" placeholder="POSTS" bind:value={editingItem.posts} />
        <textarea class="w-full border p-2" placeholder="Description" bind:value={editingItem.description}></textarea>
        <label class="flex flex-col gap-2">
          <span>Preference (1–5)</span>
          <select bind:value={editingItem.preference} class="border p-2">
            {#each [1, 2, 3, 4, 5] as num}
              <option value={num}>{num}</option>
            {/each}
          </select>
        </label>

        <div class="flex justify-end gap-2">
          <button on:click={() => (showEditModal = false)}>Cancel</button>
          <button on:click={saveModal}>Save</button>
        </div>
      </div>
    </div>
  {/if}
</UserPageLayout>
