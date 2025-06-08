<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { TreeNode } from '$lib/utils/tree-utils';
  import { mdiChevronDown, mdiChevronRight } from '@mdi/js';

  interface Props {
    node: TreeNode;
    active: string;
    icons: { default: string; active: string };
    isMenu: boolean;
    getLink: (path: string) => string;
    currentPath: string;
  }

  let {
    tree,
    parent,
    value,
    active = '',
    icons,
    getLink,
    getColor,
    isMenu = false,
    currentPath = '',
  }: Props = $props();

  const isTarget = $derived(active === node.path);
  const isActive = $derived(active === node.path || active.startsWith(node.value === '/' ? '/' : `${node.path}/`));
  let isOpen = $derived(isActive);

  const onclick = (event: MouseEvent) => {
    event.preventDefault();
    isOpen = !isOpen;
    currentPath = path;
    getLink(path);
  };
</script>

{#if isMenu}
  <div
    title={path}
    class={`flex flex-grow place-items-center pl-2 py-1 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:font-semibold ${isTarget ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
    data-sveltekit-keepfocus
    {onclick}
  >
    <button type="button" {onclick} class={Object.values(tree).length === 0 ? 'invisible' : ''}>
      <Icon path={isOpen ? mdiChevronDown : mdiChevronRight} class="text-gray-400" size={20} />
    </button>
    <div>
      <Icon
        path={isActive ? icons.active : icons.default}
        class={isActive ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400'}
        {color}
        size={20}
      />
    </div>
    <span class="text-nowrap overflow-hidden text-ellipsis font-mono pl-1 pt-1 whitespace-pre-wrap">{value}</span>
  </div>
{:else}
  <a
    href={getLink(node.path)}
    title={node.value}
    class={`flex grow place-items-center ps-2 py-1 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:font-semibold ${isTarget ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
    data-sveltekit-keepfocus
  >
    {#if node.size > 0}
      <button type="button" {onclick}>
        <Icon path={isOpen ? mdiChevronDown : mdiChevronRight} class="text-gray-400" size={20} />
      </button>
    {/if}
    <div class={node.size === 0 ? 'ml-[1.5em] ' : ''}>
      <Icon
        path={isActive ? icons.active : icons.default}
        class={isActive ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400'}
        color={node.color}
        size={20}
      />
    </div>
    <span class="text-nowrap overflow-hidden text-ellipsis font-mono ps-1 pt-1 whitespace-pre-wrap">{node.value}</span>
  </a>
{/if}
{#if isOpen}
  <TreeItems tree={node} {icons} {active} {getLink} {isMenu} {currentPath} />
{/if}
