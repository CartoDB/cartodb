var Backbone = require('backbone');
var _ = require('underscore');
var AssetsView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-view');

describe('components/form-components/editors/fill/input-color/assets-view', function () {
  beforeEach(function () {
    this.view = new AssetsView({
      model: new Backbone.Model({}),
      modalModel: {},
      configModel: {},
      userModel: {}
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
      spyOn(subView, 'unselectItems')
    });

    secondIconView._selectItem(iconFromSecond);

    _.each(this.view._assetsListViews, function (subView) {
      expect(subView.unselectItems).toHaveBeenCalled();
    });
  });
});