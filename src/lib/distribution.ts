import {
  downloadPath,
  storeNames,
  type App,
  type Distribution,
  type Locale,
} from './catalog';

const kinds: Record<Distribution['kind'], Record<Locale, string>> = {
  direct: { ja: '直接配布', en: 'Direct download' },
  store: { ja: '公式ストア', en: 'Official store' },
  web: { ja: 'Web版', en: 'Web app' },
  'github-preview': { ja: 'プレビュー版', en: 'Preview' },
};
const externalLabels = {
  web: { ja: 'ブラウザで使う', en: 'Open in browser' },
  'github-preview': {
    ja: 'GitHubでプレビュー版を見る',
    en: 'View preview on GitHub',
  },
};

export function distributionKindLabel(item: Distribution, lang: Locale) {
  return kinds[item.kind][lang];
}

export function distributionLink(
  app: Pick<App, 'id'>,
  item: Distribution,
  lang: Locale,
) {
  if (item.kind === 'direct')
    return {
      href: downloadPath(app, item),
      download: item.filename,
      rel: undefined,
      label:
        lang === 'ja'
          ? `${item.platform}版をダウンロード`
          : `Download for ${item.platform}`,
    };
  const label =
    item.kind === 'store'
      ? lang === 'ja'
        ? `${storeNames[item.store]}で見る`
        : `View on ${storeNames[item.store]}`
      : externalLabels[item.kind][lang];
  return {
    href: item.url,
    download: undefined,
    rel: 'noopener noreferrer',
    label,
  };
}
