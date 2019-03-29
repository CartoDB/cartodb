const IconCollection = require('dashboard/views/organization/icon-picker/icons/organization-icon-collection');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('organization/icon-picker/icons/organization-icon-collection', function () {
  it('should form the URL properly', function () {
    var orgId = '5p3c724-1ndv572135';
    var collection = new IconCollection(null, {
      orgId,
      configModel
    });

    expect(collection.url()).toEqual(`/api/v1/organization/${orgId}/assets`);
  });
});
