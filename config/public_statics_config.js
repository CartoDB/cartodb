/**
 * Configuration required for statics pages at frontend assets compilation¡
 * See its use from /webpack/static-pages/
 *
 * Note: don't modify its contents unless it's coordinated to work with deployments in different environments
 */

const CARTO_BUILDER_ASSET_HOST = process.env.CARTO_BUILDER_ASSET_HOST || '';
const CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE = process.env.CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE || 'http://localhost.lan:8282';

module.exports = {
  'CARTO_BUILDER_ASSET_HOST': CARTO_BUILDER_ASSET_HOST,
  'CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE': CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE
};
