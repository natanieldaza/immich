<script lang="ts">
  import Tree from '$lib/components/shared-components/tree/tree.svelte';
  import { normalizeTreePath, type RecursiveObject } from '$lib/utils/tree-utils';

  interface Props {
    items: RecursiveObject;
    parent?: string;
    active?: string;
    icons: { default: string; active: string };
    isMenu: boolean;
    currentPath: string;
    getLink: (path: string) => string;
    getColor?: (path: string) => string | undefined;
  }

  let {
    items,
    parent = '',
    active = '',
    icons,
    getLink,
    getColor = () => undefined,
    isMenu = false,
    currentPath = '',
  }: Props = $props();
</script>

<ul class="list-none ms-2">
  <!-- eslint-disable-next-line svelte/require-each-key -->
  {#each Object.entries(items).sort() as [path, tree]}
    {@const value = normalizeTreePath(`${parent}/${path}`)}
    {@const key = value + getColor(value)}
    {#key key}
      <li>
        <Tree {parent} value={path} {tree} {icons} {active} {getLink} {getColor} {isMenu} {currentPath} />
      </li>
    {/key}
  {/each}
</ul>
