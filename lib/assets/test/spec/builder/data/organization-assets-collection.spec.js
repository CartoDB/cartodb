var Backbone = require('backbone');
var OrganizationAssetsCollection = require('builder/data/organization-assets-collection');

describe('data/organization-assets-collection', function () {
  beforeEach(function () {
    var orgId = '5p3c724-1ndv572135';

    var configModel = new Backbone.Model({
      base_url: 'a_url'
    });

    configModel.urlVersion = function () { return 'v808'; };
    this.collection = new OrganizationAssetsCollection(null, {
      configModel: configModel,
      orgId: orgId
    });
  });

  it('should form url properly', function () {
    var url = this.collection.url();

    expect(url).toBe('a_url/api/v808/organization/5p3c724-1ndv572135/assets');
  });
});
