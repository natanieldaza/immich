import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllSitesUrl } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const urls = await getAllSitesUrl();
  const $t = await getFormatter();

  return {
    urls,
    meta: {
      title: $t('urls'),
    },
  };
}) satisfies PageLoad;
