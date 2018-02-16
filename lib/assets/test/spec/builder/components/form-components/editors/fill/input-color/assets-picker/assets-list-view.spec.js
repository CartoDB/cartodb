var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var AssetsListView = require('builder/components/form-components/editors/fill/input-color/assets-picker/assets-list-view');

describe('components/form-components/editors/fill/input-color/asset-picker/assets-list-view', function () {
  function createViewFn (options) {
    var icons = [
      { name: 'icon1', icon: 'icon1' },
      { name: 'icon2', icon: 'icon2' },
      { name: 'icon3', icon: 'icon3' }
    ];

    this.view = new AssetsListView(_.extend({
      selectedAsset: new Backbone.Model(),
      title: 'Title',
      icons: icons,
      disclaimer: 'Disclaimer',
      folder: 'folder',
      kind: 'marker',
      size: '10'
    }, options));
  }

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  afterEach(function () {
    this.view.remove();
  });

  describe('.initialize', function () {
    it('should call ._setupAssets and get assets with default options if no options provided', function () {
      this.createView();

      var itemNames = _.map(this.view._assetsCollection.models, function (model) {
        return model.attributes.name;
      });

      expect(itemNames.length).toBe(3);
      expect(_.contains(itemNames, 'icon1'));
      expect(_.contains(itemNames, 'icon2'));
      expect(_.contains(itemNames, 'icon3'));
    });

    it('should call ._setupAssets and get assets with provided options', function () {
      this.createView({
        folder: 'a folder',
        size: 48,
        host: 'a host',
        ext: 'an extension'
      });

      _.each(this.view._assetsCollection.models, function (model) {
        expect(model.attributes.ext).toBe('an extension');
        expect(model.attributes.folder).toBe('a folder');
        expect(model.attributes.host).toBe('a host');
        expect(model.attributes.size).toBe(48);
      });
    });

    it('should limit asset collection length if limit option is present', function () {
      this.createView({
        limit: 2
      });

      var itemNames = _.map(this.view._assetsCollection.models, function (model) {
        return model.attributes.name;
      });

      expect(itemNames.length).toBe(2);
      expect(_.contains(itemNames, 'icon1'));
      expect(_.contains(itemNames, 'icon2'));
    });

    it('should add related models', function () {
      spyOn(CoreView.prototype, 'add_related_model').and.callThrough();
      this.createView();

      expect(CoreView.prototype.add_related_model).toHaveBeenCalledWith(this.view._assetsCollection);
    });
  });

  describe('render', function () {
    it('should render icons according to the template', function () {
      this.createView();

      this.view.render();

      var expectedIcons = ['icon1', 'icon2', 'icon3'];
      _.each(expectedIcons, function (icon) {
        var $icon = this.view.$("img[alt='" + icon + "']");
        expect($icon.length).toBe(1);
        expect($icon.attr('crossorigin')).toBe('anonymous');
        expect($icon.attr('src').indexOf(icon)).not.toBe(0);
      }, this);
    });
  });

  describe('._selectItem', function () {
    it('should select given item and deselect the others', function () {
      var selectedAsset = new Backbone.Model();

      this.createView({
        selectedAsset: selectedAsset
      });

      this.view.render();

      var url = this.view.$('.AssetsList-item:nth-child(1) img').attr('src');
      this.view.$('.AssetsList-item:nth-child(1) .js-asset').click();

      expect(selectedAsset.get('url')).toBe(url);
      expect(selectedAsset.get('kind')).toBe('marker');
    });
  });
});
