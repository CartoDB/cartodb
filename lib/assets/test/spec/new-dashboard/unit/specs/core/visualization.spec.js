import mapArray from '../fixtures/visualizations';
import * as Visualization from 'new-dashboard/core/visualization.js';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || {});
  const config = new ConfigModel(attributes.config || {});
  return { user, config };
}

describe('visualization.js', () => {
  it('should return correct own url', () => {
    const $cartoModels = configCartoModels();
    const map = mapArray.visualizations[0];

    const url = Visualization.getURL(map, $cartoModels);

    expect(url).toBe('https://team.carto.com/u/cillas/viz/f8e13983-bb08-4ca9-b64a-f34e76fe077a');
  });

  it('should return correct shared url', () => {
    const $cartoModels = configCartoModels();
    const map = mapArray.visualizations[0];

    const url = Visualization.getURL(map, $cartoModels);

    expect(url).toBe('https://team.carto.com/u/cillas/viz/f8e13983-bb08-4ca9-b64a-f34e76fe077a');
  });

  it('should return correct regular thumbnail url', () => {
    const $cartoModels = configCartoModels();
    const map = mapArray.visualizations[0];

    const thumbnailUrl = Visualization.getThumbnailUrl(map, $cartoModels, { width: 288, height: 125 });

    expect(thumbnailUrl).toMatch(/^http(s)?:\/\/.+\/api\/v1\/map\/static\/named\/tpl_f8e13983_bb08_4ca9_b64a_f34e76fe077a\/288\/125\.png\?auth_token=feZhHEP4vJEbTbF3PEgyvA&auth_token=00580a1519bad8a50dba717dc0bb82bd357084c01212ba90f6058a226457e77d$/);
  });

  it('should return correct cdn thumbnail url', () => {
    const $cartoModels = configCartoModels();
    const map = mapArray.visualizations[0];

    const thumbnailUrl = Visualization.getThumbnailUrl(map, $cartoModels, { width: 288, height: 125 });

    expect(thumbnailUrl).toMatch(/^http(s)?:\/\/.+\/api\/v1\/map\/static\/named\/tpl_f8e13983_bb08_4ca9_b64a_f34e76fe077a\/288\/125\.png\?auth_token=feZhHEP4vJEbTbF3PEgyvA&auth_token=00580a1519bad8a50dba717dc0bb82bd357084c01212ba90f6058a226457e77d$/);
  });
});
