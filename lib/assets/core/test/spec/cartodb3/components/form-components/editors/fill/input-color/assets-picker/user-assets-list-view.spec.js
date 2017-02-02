var cdb = require('cartodb.js');
var Backbone = require('backbone');
var UserAssetsListView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/user-assets-list-view');

fdescribe('components/form-components/editors/fill/input-color/assets-picker/user-assets-list-view', function () {
  beforeEach(function () {
    this.model = new cdb.core.Model();
    this.selectedAsset = new cdb.core.Model();

    this._assetsCollection = new Backbone.Collection([]);

    this.view = new UserAssetsListView({
      title: 'Title',
      model: this.model,
      assets: this._assetsCollection,
      selectedAsset: this.selectedAsset
    });

    this.view.render();
  });

  it('should trigger an upload event', function () {
    var triggered = false;

    this.view.bind('init-upload', function () {
      triggered = true;
    }, this);

    this.view.$el.find('.AssetsList-item--text .js-asset').click();
    expect(triggered).toBeTruthy();
  });
});

