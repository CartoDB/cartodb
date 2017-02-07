var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var AssetsListView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/assets-list-view');

describe('components/form-components/editors/fill/input-color/asset-picker/assets-list-view', function () {
  function createViewFn (options) {
    var icons = [
      { name: 'icon1', icon: 'icon1' },
      { name: 'icon2', icon: 'icon2' },
      { name: 'icon3', icon: 'icon3' }
    ];
    this.view = new AssetsListView(_.extend({ icons: icons }, options));
  }

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  describe('.initialize', function () {
    it('should call ._setupAssets and get items with default options if no options provided', function () {
      this.createView();

      var itemNames = _.map(this.view._items.models, function (model) {
        return model.attributes.name;
      });

      expect(itemNames.length).toBe(3);
      expect(_.contains(itemNames, 'icon1'));
      expect(_.contains(itemNames, 'icon2'));
      expect(_.contains(itemNames, 'icon3'));
    });

    it('should call ._setupAssets and get items with provided options', function () {
      this.createView({
        folder: 'a folder',
        size: 48,
        host: 'a host',
        ext: 'an extension'
      });

      _.each(this.view._items.models, function (model) {
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

      var itemNames = _.map(this.view._items.models, function (model) {
        return model.attributes.name;
      });

      expect(itemNames.length).toBe(2);
      expect(_.contains(itemNames, 'icon1'));
      expect(_.contains(itemNames, 'icon2'));
    });

    it('should add related models', function () {
      spyOn(CoreView.prototype, 'add_related_model').and.callThrough();
      this.createView();

      expect(CoreView.prototype.add_related_model).toHaveBeenCalledWith(this.view._items);
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
      this.createView();
      this.view.model = new Backbone.Model();
      this.view._items.models[0].set('state', 'selected');

      this.view._selectItem(this.view._items.models[1]);

      expect(this.view.model.get('image')).toEqual(this.view._items.models[1].get('public_url'));
      expect(this.view._items.models[0].get('state')).toEqual('idle');
    });
  });
});
