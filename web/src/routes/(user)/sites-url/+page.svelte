<script lang="ts">
  import { goto } from '$app/navigation';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';

  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import SiteUrlModal from '$lib/modals/SiteUrlModal.svelte';

  import { AppRoute } from '$lib/constants';
  import {
    deleteSitesUrl,
    downloadSitesUrl,
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
  let sortKey = $state<keyof SitesUrlResponseDto>('createdAt');
  let sortAsc = $state(true);
  let pager = $state(1);
  let pageSize = 100;

  let isNew = false;
  let editingItem: SitesUrlCreateDto | SitesUrlResponseDto | null = null;
  let inlineEditingId: string | null = null;
  let selectedPreference = 0;

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

  const openCreateModal = async () => {
    const newSite: SitesUrlCreateDto = {
      url: 'https://',
      description: '',
      preference: 3,
      posts: 0,
      failed: false,
      lastDownloadedNode: '',
    };

    const savedUrl = await modalManager.show<SiteUrlModal>(SiteUrlModal, {
      newSiteUrl: newSite,
      isNew: true,
    });

    if (savedUrl) {
      $urls = [...$urls, savedUrl]; // Update the reactive store with the new URL
      pager = Math.ceil($urls.length / pageSize); // Adjust pager to show the new item
    }
    // Note: modalManager.show returns a promise that resolves with the saved URL

    return savedUrl;
  };

  const openEditModal = async (item: SitesUrlResponseDto) => {
    const editingItem: SitesUrlUpdateDto = {
      id: item.id,
      url: item.url,
      description: item.description,
      preference: item.preference,
      posts: item.posts,
      failed: item.failed,
      lastDownloadedNode: item.lastDownloadedNode,
    };

    const savedUrl = await modalManager.show<{
      updateSiteUrl: SitesUrlUpdateDto;
      isNew: boolean;
      id?: string;
      onClose: (siteUrlUpdated?: SitesUrlCreateDto) => void;
    }>(SiteUrlModal, {
      updateSiteUrl: editingItem,
      isNew: false,
      id: item.id,
    });

    if (savedUrl) {
      $urls = $urls.map((u) => (u.id === item.id ? savedUrl : u));
      pager = Math.ceil($urls.length / pageSize);
    }
  };

  function openInlineEdit(item: SitesUrlResponseDto) {
    inlineEditingId = item.id;
    editingItem = { ...item };
    isNew = false;
  }

  async function deleteRow(id: string) {
    await deleteSitesUrl({ id });
    await fetchData(); // ✅ properly updates UI
    pager = 1;
  }
  async function downlodadUrl(id: string) {
    try {
      await downloadSitesUrl({ id });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Download started successfully',
      });
    } catch (err) {
      console.error('Download failed:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Download failed',
      });
    }
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

  async function downloadAll() {
    try {
      //await downloadAllSitesUrl();
      notificationController.show({
        type: NotificationType.Info,
        message: 'All downloads started successfully',
      });
    } catch (err) {
      console.error('Download all failed:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Download all failed',
      });
    }
  }

  async function downloadPriority() {
    try {
      //await downloadSitesUrlByPreference({ preference: 0 });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Priority download started',
      });
    } catch (err) {
      console.error('Priority download failed:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Priority download failed',
      });
    }
  }

  async function downloadBySelectedPreference() {
    try {
      //await downloadSitesUrlByPreference({ preference: selectedPreference });
      notificationController.show({
        type: NotificationType.Info,
        message: `Download started for preference ${selectedPreference}`,
      });
    } catch (err) {
      console.error('Download by preference failed:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Download by preference failed',
      });
    }
  }
</script>

<UserPageLayout
  title={$t('sites_url_title')}
  description={$t('sites_url_description')}
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
        <thead class="bg-white-100">
          <tr>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('url')}>URL</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('posts')}>POSTS</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('description')}>Description</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('createdAt')}>Created</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('visitedAt')}>Visited</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('preference')}>Preference</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('runAt')}>Runned</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('failed')}>Failed</th>
            <th class="p-2 cursor-pointer" on:click={() => toggleSort('lastDownloadedNode')}>Last Downloaded Node</th>
            <th class="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each getPaginated() as item}
            <tr class="border-t hover:bg-gray-50">
              <td class="p-2 break-words">
                <a href={item.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                  {item.url.startsWith('http') ? item.url : `https://${item.url}`}</a
                ></td
              >
              <td class="p-2">{item.posts ?? '-'}</td>
              <td class="p-2 break-words">{item.description ?? '-'}</td>
              <td class="p-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
              <td class="p-2">{item.visitedAt ? new Date(item.visitedAt).toLocaleString() : '-'}</td>
              <td class="p-2">{item.preference ?? '-'}</td>
              <td class="p-2">{item.runAt ? new Date(item.runAt).toLocaleString() : '-'}</td>
              <td class="p-2">{item.failed == null ? '-' : item.failed ? 'Yes' : 'No'}</td>
              <td class="p-2 break-words">
                {item.lastDownloadedNode ? item.lastDownloadedNode.name : '-'}
              </td>
              <td class="p-2 flex flex-col sm:flex-row gap-2">
                <button on:click={() => openEditModal(item)}>Edit</button>
                <button on:click={() => deleteRow(item.id)}>Delete</button>
                <button on:click={() => downlodadUrl(item.id)}>Download</button>
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

  <div class="mt-4 flex items-center justify-between flex-wrap gap-2">
    <div class="flex gap-2">
      <button on:click={() => (pager = Math.max(1, pager - 1))} disabled={pager === 1}>Previous</button>
      <span>Page {pager}</span>
      <button on:click={() => (pager += 1)} disabled={pager * pageSize >= getFiltered().length}>Next</button>
      <span class="ml-2">Total: {getFiltered().length} items</span>
    </div>
    <div class="flex gap-2 flex-wrap">
      <button class="px-4 py-2 bg-blue-500 text-white rounded" on:click={openCreateModal}>Add New</button>
      <button class="px-4 py-2 bg-green-500 text-white rounded" on:click={downloadAll}>Download All</button>
      <button class="px-4 py-2 bg-orange-500 text-white rounded" on:click={downloadPriority}>Download Priority</button>
      <div class="flex items-center gap-2">
        <label for="preference" class="text-sm font-medium">Preference:</label>
        <select id="preference" class="border rounded px-2 py-1" bind:value={selectedPreference}>
          <option value="0">0 (All)</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        <button class="px-4 py-2 bg-purple-500 text-white rounded" on:click={downloadBySelectedPreference}>
          Download by Preference
        </button>
      </div>
    </div>
  </div>
</UserPageLayout>
