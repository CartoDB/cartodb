var UserLayers = require('../../../../javascripts/cartodb3/data/user-layers-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');

describe('data/user-layers-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layers = new UserLayers(this.get('layers'), {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });
  });
});
