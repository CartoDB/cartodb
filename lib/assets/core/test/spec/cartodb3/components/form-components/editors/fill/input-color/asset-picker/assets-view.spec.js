var Backbone = require('backbone');
var _ = require('underscore');
var AssetsView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/assets-view');

describe('components/form-components/editors/fill/input-color/assets-view', function () {
  beforeEach(function () {
    this.view = new AssetsView({
      model: new Backbone.Model({
        image: ''
      }),
      modalModel: {
        destroy: function () {}
      },
      configModel: {},
      userModel: {}
    });
  });

  describe('initialize', function () {
    it('should bind `change:image` to _onChangeModel', function () {
      this.view.render();
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(true);

      this.view.model.set('image', 'batman.png');

      expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(false);
    });
  });

  describe('_onSetImage', function () {
    it('should kill event, trigger a `change` event and destroy modal', function () {
      var event = 'an event';
      var changeTriggered = false;
      var changeImage;
      this.view.on('change', function (data) {
        changeTriggered = true;
        changeImage = data;
      });
      spyOn(this.view, 'killEvent');
      spyOn(this.view._modalModel, 'destroy');
      this.view.model.set('image', 'donatello.jpg');

      this.view._onSetImage(event);

      expect(this.view.killEvent).toHaveBeenCalled();
      expect(changeTriggered).toBe(true);
      expect(changeImage).toBe('donatello.jpg');
      expect(this.view._modalModel.destroy).toHaveBeenCalled();
    });
  });

  describe('render', function () {
    it('should render the three icon tabs', function () {
      this.view.render();

      expect(this.view._assetsListViews.length).toBe(3);
      expect(this.view.$('.js-items').length).toBe(3);
      var tabHeaders = this.view.$('h2.CDB-Size-small');
      expect(tabHeaders[0].textContent).toBe('Pin icons');
      expect(tabHeaders[1].textContent).toBe('Simple icons');
      expect(tabHeaders[2].textContent).toBe('Maki icons');
    });
  });

  it('should unselect all icons but the selected one if a new one is selected', function () {
    this.view.render();
    var firstIconView = this.view._assetsListViews[0];
    var secondIconView = this.view._assetsListViews[1];
    var iconFromFirst = firstIconView._items.at(0);
    var iconFromSecond = secondIconView._items.at(0);
    firstIconView._selectItem(iconFromFirst);

    _.each(this.view._assetsListViews, function (subView) {
      spyOn(subView, 'unselectItems');
    });

    secondIconView._selectItem(iconFromSecond);

    _.each(this.view._assetsListViews, function (subView) {
      expect(subView.unselectItems).toHaveBeenCalled();
    });
  });

  describe('_onImageSelected', function () {
    it('should unselect items in all subviews', function () {
      var image = 'splinter.svg';
      this.view.render();
      _.each(this.view._assetsListViews, function (subview) {
        spyOn(subview, 'unselectItems');
      });

      this.view._onImageSelected(image);

      _.each(this.view._assetsListViews, function (subview) {
        expect(subview.unselectItems).toHaveBeenCalledWith(image);
      });
    });
  });
});
