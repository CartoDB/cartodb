var Backbone = require('backbone');
var AssetsCollection = require('builder/data/assets-collection');

describe('data/assets-collection', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      base_url: 'a_url'
    });
    configModel.urlVersion = function () { return 'v808'; };
    this.collection = new AssetsCollection(null, {
      configModel: configModel,
      userModel: new Backbone.Model({
        id: 707
      })
    });
  });

  it('should form url properly', function () {
    var url = this.collection.url();

    expect(url).toBe('a_url/api/v808/users/707/assets');
  });
});
