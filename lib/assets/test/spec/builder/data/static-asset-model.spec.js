var StaticAssetModel = require('builder/data/static-asset-model');

describe('data/static-asset-model', function () {
  beforeEach(function () {
    this.model = new StaticAssetModel();
  });
  describe('.getUrlFor', function () {
    it('should return the proper URL', function () {
      expect(this.model.getURLFor('paella'))
        .toEqual('https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/paella-18.svg');
    });
  });
});
