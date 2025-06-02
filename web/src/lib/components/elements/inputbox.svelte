<script lang="ts">
  interface Props {
    type: 'text' | 'email' | 'password' | 'number' | 'textarea';
    value?: string | number;
    placeholder?: string;
    id?: string;
    error?: string;
    multiline?: boolean;
    inputClass?: string;
  }

  let {
    type = 'text',
    value = $bindable(),
    placeholder = '',

    id = '',
    error = '',
    multiline = false,
    inputClass = 'w-full gap-2 bg-immich-bg dark:bg-immich-dark-bg',
  }: Props = $props();
</script>

{#if multiline}
  <textarea {id} bind:value {placeholder} class="{inputClass} textarea {error ? 'input-error' : ''}" rows="4"
  ></textarea>
{:else}
  <input {id} {type} bind:value {placeholder} class="{inputClass} {error ? 'input-error' : ''}" />
{/if}

{#if error}
  <p class="error-message">{error}</p>
{/if}
