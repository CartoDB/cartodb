var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');
var OrganizationAssetsCollection = require('../../../../../../../../../javascripts/cartodb3/data/organization-assets-collection');
var OrganizationAssetsListView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/organization-assets-list-view');

describe('components/form-components/editors/fill/input-color/assets-picker/organization-assets-list-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model();
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
      userModel: userModel
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
    expect(this.view.$el.find('.js-asset').length).toBe(this._userAssetCollection.size() + 1);
  });

  it('should render the add button', function () {
    expect(this.view.$el.find('.AssetsList-item--text .js-asset').text().trim()).toBe('+');
    expect(this.view.$el.find('.AssetsList-item--text .js-asset').length).toBe(1);
  });

  it('should select an asset', function () {
    this._organizationAssetCollection.at(0).set('state', '');
    this._organizationAssetCollection.at(1).set('state', '');
    this._organizationAssetCollection.at(2).set('state', '');

    expect(this._organizationAssetCollection.where({ state: 'selected' }).length).toBe(0);
    $(this.view.$('.js-asset')[1]).click();
    expect(this.view.$('.is-selected').length).toBe(1);
    expect(this._organizationAssetCollection.where({ state: 'selected' }).length).toBe(1);
    expect(this._organizationAssetCollection.at(0).get('state')).toBe('selected');
  });

  it('should deselect all the organization assets when a user asset is selected and viceversa', function () {
    this._userAssetCollection.at(0).set('state', 'selected');

    expect(this._userAssetCollection.at(0).get('state')).toBe('selected');
    expect(this._organizationAssetCollection.at(0).get('state')).toBe('');

    this._organizationAssetCollection.at(0).set('state', 'selected');

    expect(this._userAssetCollection.at(0).get('state')).toBe('');
    expect(this._organizationAssetCollection.at(0).get('state')).toBe('selected');

    this._userAssetCollection.at(0).set('state', 'selected');

    expect(this._userAssetCollection.at(0).get('state')).toBe('selected');
    expect(this._organizationAssetCollection.at(0).get('state')).toBe('');
    expect(this.view.$('.is-selected').length).toBe(0);
  });

  afterEach(function () {
    this.view.clean();
  });
});
