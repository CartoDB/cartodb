var $ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AssetsCollection = require('builder/data/assets-collection');
var OrganizationAssetsCollection = require('builder/data/organization-assets-collection');
var OrganizationAssetsListView = require('builder/components/form-components/editors/fill/input-color/assets-picker/organization-assets-list-view');

describe('components/form-components/editors/fill/input-color/assets-picker/organization-assets-list-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      image: '/image.png'
    });
    this.selectedAsset = new Backbone.Model();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this._userAssetCollection = new AssetsCollection([{
      item: 1, state: ''
    }, {
      item: 2, state: ''
    }, {
      item: 3, state: ''
    }], {
      configModel: configModel,
      userModel: userModel
    });

    this._organizationAssetCollection = new OrganizationAssetsCollection([{
      item: 1, state: ''
    }, {
      item: 2, state: ''
    }, {
      item: 3, state: ''
    }], {
      configModel: configModel,
      orgId: userModel
    });

    this.view = new OrganizationAssetsListView({
      title: 'Title',
      model: this.model,
      userAssetCollection: this._userAssetCollection,
      organizationAssetCollection: this._organizationAssetCollection,
      selectedAsset: this.selectedAsset,
      userModel: userModel
    });

    this.view.render();
  });

  it('should render the assets', function () {
    expect(this.view.$el.find('.js-asset').length).toBe(this._userAssetCollection.size());
  });

  it('should select an asset and deselect all the user assets', function () {
    this._userAssetCollection.at(0).set('state', 'selected');

    expect(this._organizationAssetCollection.where({ state: 'selected' }).length).toBe(0);
    expect(this._organizationAssetCollection.at(0).get('state')).toBe('');
    expect(this._userAssetCollection.where({ state: 'selected' }).length).toBe(1);
    expect(this._userAssetCollection.at(0).get('state')).toBe('selected');

    $(this.view.$('.js-asset')[0]).click();

    expect(this.view.$('.is-selected').length).toBe(1);
    expect(this._organizationAssetCollection.where({ state: 'selected' }).length).toBe(1);
    expect(this._organizationAssetCollection.at(0).get('state')).toBe('selected');
    expect(this._userAssetCollection.where({ state: 'selected' }).length).toBe(0);
    expect(this._userAssetCollection.at(0).get('state')).toBe('');
  });

  afterEach(function () {
    this.view.clean();
  });
});
