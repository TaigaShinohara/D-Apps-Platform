import {
  downloadPath,
  storeNames,
  type App,
  type Distribution,
  type Locale,
} from './catalog';

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
  return {
    href: item.url,
    download: undefined,
    rel: 'noopener noreferrer',
    label:
      lang === 'ja'
        ? `${storeNames[item.store]}で見る`
        : `View on ${storeNames[item.store]}`,
  };
}
