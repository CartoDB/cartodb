export function getAssetsBaseUrl () {
  const data = window.CartoConfig.data;
  const dataAssetsHost = data.asset_host && data.asset_host + '/assets';

  const assetsBaseUrl =
    window.StaticConfig.assetsBaseUrl ||
    dataAssetsHost ||
    data.config.app_assets_base_url;

  return assetsBaseUrl + '/';
}
