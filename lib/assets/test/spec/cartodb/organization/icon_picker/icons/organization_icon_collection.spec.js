var IconCollection = require('../../../../../../javascripts/cartodb/organization/icon_picker/icons/organization_icon_collection');

describe('organization/icon_picker/icons/organization_icon_collection', function () {
  it('should form the URL properly', function () {
    var orgId = '5p3c724-1ndv572135';
    var collection = new IconCollection(null, {
      orgId: orgId
    });

    expect(collection.url()).toEqual('/api/v1/organization/' + orgId + '/assets');
  });
});
