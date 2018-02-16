var $ = require('jquery');
var Backbone = require('backbone');
var UserAssetsListView = require('builder/components/form-components/editors/fill/input-color/assets-picker/user-assets-list-view');
var AssetsCollection = require('builder/data/assets-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var OrganizationAssetsCollection = require('builder/data/organization-assets-collection');
var AssetModel = require('builder/data/asset-model');

describe('components/form-components/editors/fill/input-color/assets-picker/user-assets-list-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      image: '/image.png'
    });
    this.selectedAsset = new Backbone.Model();

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    var asset1 = new AssetModel({
      item: 1, state: '', public_url: 'one.jpg'
    });

    var asset2 = new AssetModel({
      item: 2, state: '', public_url: 'two.png'
    });

    var asset3 = new AssetModel({
      item: 3, state: '', public_url: 'three.gif'
    });

    this._userAssetCollection = new AssetsCollection([asset1, asset2, asset3], {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.view = new UserAssetsListView({
      title: 'Title',
      model: this.model,
      userAssetCollection: this._userAssetCollection,
      selectedAsset: this.selectedAsset,
      userModel: this.userModel
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

  it('should trigger an upload event when clicking the add button', function () {
    var triggered = false;

    this.view.bind('init-upload', function () {
      triggered = true;
    }, this);

    this.view.$el.find('.AssetsList-item--text .js-asset').click();
    expect(triggered).toBeTruthy();
  });

  it('should select an asset', function () {
    this._userAssetCollection.at(0).set('state', '');
    this._userAssetCollection.at(1).set('state', '');
    this._userAssetCollection.at(2).set('state', '');

    expect(this._userAssetCollection.where({ state: 'selected' }).length).toBe(0);
    $(this.view.$('.js-asset')[1]).click();
    expect(this.view.$('.is-selected').length).toBe(1);
    expect(this._userAssetCollection.where({ state: 'selected' }).length).toBe(1);
    expect(this._userAssetCollection.at(0).get('state')).toBe('selected');
  });

  it('should select all the assets', function () {
    this._userAssetCollection.at(0).set('state', 'selected');

    this.view.$('.js-select-all').click();
    expect(this.view.$('.is-selected').length).toBe(3);
    expect(this._userAssetCollection.at(0).get('state')).toBe('selected');
    expect(this._userAssetCollection.at(1).get('state')).toBe('selected');
    expect(this._userAssetCollection.at(2).get('state')).toBe('selected');
  });

  it('should deselect all the assets', function () {
    this._userAssetCollection.at(0).set('state', 'selected');
    this._userAssetCollection.at(1).set('state', 'selected');
    this._userAssetCollection.at(2).set('state', 'selected');

    this.view.$('.js-deselect-all').click();
    expect(this._userAssetCollection.at(0).get('state')).toBe('');
    expect(this._userAssetCollection.at(1).get('state')).toBe('');
    expect(this._userAssetCollection.at(2).get('state')).toBe('');
    expect(this.view.$('.is-selected').length).toBe(0);
  });

  describe('when user is inside organization', function () {
    var view;

    beforeEach(function () {
      spyOn(this.userModel, 'isInsideOrg').and.returnValue(true);

      this._organizationAssetCollection = new OrganizationAssetsCollection([{
        item: 1, state: ''
      }, {
        item: 2, state: ''
      }, {
        item: 3, state: ''
      }], {
        configModel: this.configModel,
        orgId: this.userModel
      });

      view = new UserAssetsListView({
        title: 'Title',
        model: this.model,
        userAssetCollection: this._userAssetCollection,
        organizationAssetCollection: this._organizationAssetCollection,
        selectedAsset: this.selectedAsset,
        userModel: this.userModel
      });

      view.render();
    });

    it('should select an asset and deselect all the organization assets', function () {
      this._organizationAssetCollection.at(0).set('state', 'selected');

      expect(this._userAssetCollection.where({ state: 'selected' }).length).toBe(0);
      expect(this._userAssetCollection.at(0).get('state')).toBe('');
      expect(this._organizationAssetCollection.where({ state: 'selected' }).length).toBe(1);
      expect(this._organizationAssetCollection.at(0).get('state')).toBe('selected');

      $(view.$('.js-asset')[1]).click();

      expect(this.view.$('.is-selected').length).toBe(1);
      expect(this._userAssetCollection.where({ state: 'selected' }).length).toBe(1);
      expect(this._userAssetCollection.at(0).get('state')).toBe('selected');
      expect(this._organizationAssetCollection.where({ state: 'selected' }).length).toBe(0);
      expect(this._organizationAssetCollection.at(0).get('state')).toBe('');
    });
  });

  it('should remove selected assets', function () {
    this._userAssetCollection.at(0).set('state', 'selected');
    this._userAssetCollection.at(1).set('state', 'selected');
    this._userAssetCollection.at(2).set('state', '');

    this.view.$('.js-remove').click();
    expect(this._userAssetCollection.size()).toBe(1);
  });

  it('should unset the selected asset', function () {
    var self = this;

    AssetModel.prototype.destroy = function () {
      self.view._onDestroyFinished({ status: 200 });
    };

    this._userAssetCollection.at(0).set('state', 'selected');
    this._userAssetCollection.at(1).set('state', '');
    this._userAssetCollection.at(2).set('state', '');

    expect(this.selectedAsset.get('url')).toBe('one.jpg');
    expect(this.selectedAsset.get('kind')).toBe('custom-marker');

    this.view.$('.js-remove').click();
    expect(this.selectedAsset.get('url')).toBe(undefined);
    expect(this.selectedAsset.get('kind')).toBe(undefined);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
