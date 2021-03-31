/**
 * Configuration required for statics pages at frontend assets compilation¡
 * See its use from /webpack/static-pages/
 *
 * Note: don't modify its contents unless it's coordinated to work with deployments in different environments
 */

const CARTO_BUILDER_ASSET_HOST = JSON.stringify(process.env.CARTO_BUILDER_ASSET_HOST || '');
const CARTO_MAPS_API_V2_EXTERNAL_URL = JSON.stringify(process.env.CARTO_MAPS_API_V2_EXTERNAL_URL || 'https://maps-api-v2.carto-staging.com/user/{user}');

module.exports = {
  'CARTO_BUILDER_ASSET_HOST': CARTO_BUILDER_ASSET_HOST,
  'CARTO_MAPS_API_V2_EXTERNAL_URL': CARTO_MAPS_API_V2_EXTERNAL_URL
};
