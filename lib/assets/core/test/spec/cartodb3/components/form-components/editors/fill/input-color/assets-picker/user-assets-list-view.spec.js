var $ = require('jquery');
var Backbone = require('backbone');
var UserAssetsListView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/user-assets-list-view');
var AssetsCollection = require('../../../../../../../../../javascripts/cartodb3/data/assets-collection');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../../../javascripts/cartodb3/data/user-model');

describe('components/form-components/editors/fill/input-color/assets-picker/user-assets-list-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model();
    this.selectedAsset = new Backbone.Model();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this._assetsCollection = new AssetsCollection([{
      item: 1, state: ''
    }, {
      item: 2, state: ''
    }, {
      item: 3, state: ''
    }], {
      configModel: configModel,
      userModel: userModel
    });

    this.view = new UserAssetsListView({
      title: 'Title',
      model: this.model,
      assetsCollection: this._assetsCollection,
      selectedAsset: this.selectedAsset
    });

    this.view.render();
  });

  it('should render the assets', function () {
    expect(this.view.$el.find('.js-asset').length).toBe(this._assetsCollection.size() + 1);
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
    this._assetsCollection.at(0).set('state', '');
    this._assetsCollection.at(1).set('state', '');
    this._assetsCollection.at(2).set('state', '');

    expect(this._assetsCollection.where({ state: 'selected' }).length).toBe(0);
    $(this.view.$('.js-asset')[1]).click();
    expect(this.view.$('.is-selected').length).toBe(1);
    expect(this._assetsCollection.where({ state: 'selected' }).length).toBe(1);
    expect(this._assetsCollection.at(0).get('state')).toBe('selected');
  });

  it('should select all the assets', function () {
    this._assetsCollection.at(0).set('state', 'selected');

    this.view.$('.js-select-all').click();
    expect(this.view.$('.is-selected').length).toBe(3);
    expect(this._assetsCollection.at(0).get('state')).toBe('selected');
    expect(this._assetsCollection.at(1).get('state')).toBe('selected');
    expect(this._assetsCollection.at(2).get('state')).toBe('selected');
  });

  it('should deselect all the assets', function () {
    this._assetsCollection.at(0).set('state', 'selected');
    this._assetsCollection.at(1).set('state', 'selected');
    this._assetsCollection.at(2).set('state', 'selected');

    this.view.$('.js-deselect-all').click();
    expect(this._assetsCollection.at(0).get('state')).toBe('');
    expect(this._assetsCollection.at(1).get('state')).toBe('');
    expect(this._assetsCollection.at(2).get('state')).toBe('');
    expect(this.view.$('.is-selected').length).toBe(0);
  });

  it('should remove selected assets', function () {
    this._assetsCollection.at(0).set('state', 'selected');
    this._assetsCollection.at(1).set('state', 'selected');
    this._assetsCollection.at(2).set('state', '');

    this.view.$('.js-remove').click();
    expect(this._assetsCollection.size()).toBe(1);
    expect(this._selectAllAsset.get('url')).toBe(undefined);
    expect(this._selectAllAsset.get('kind')).toBe(undefined);
  });

  afterEach(function () {
    this.view.clean();
  });
});

