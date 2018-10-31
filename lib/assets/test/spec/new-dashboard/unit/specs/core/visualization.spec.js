import mapArray from '../fixtures/visualizations';
import * as Visualization from 'new-dashboard/core/visualization.js';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

let $cartoModels;

describe('visualization.js', () => {
  beforeEach(() => {
    const user = new UserModel({});
    const config = new ConfigModel({});
    $cartoModels = { user, config };
  });

  it('should return correct url', () => {
    const map = mapArray.visualizations[0];

    const url = Visualization.getURL(map, $cartoModels);

    expect(url).toBe('https://team.carto.com/u/cillas/viz/f8e13983-bb08-4ca9-b64a-f34e76fe077a');
  });

  it('should return correct thumbnail url', () => {
    const map = mapArray.visualizations[0];

    const thumbnailUrl = Visualization.getThumbnailUrl(map, $cartoModels, { width: 288, height: 125 });

    expect(thumbnailUrl).toMatch(/^http(s)?:\/\/.+\/api\/v1\/map\/static\/named\/tpl_f8e13983_bb08_4ca9_b64a_f34e76fe077a\/288\/125\.png\?auth_token=feZhHEP4vJEbTbF3PEgyvA&auth_token=00580a1519bad8a50dba717dc0bb82bd357084c01212ba90f6058a226457e77d$/);
  });
});
