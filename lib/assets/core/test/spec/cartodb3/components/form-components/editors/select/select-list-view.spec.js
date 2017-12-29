var Backbone = require('backbone');
var SelectListView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/select/select-list-view');
var itemListTemplate = require('../../../../../../../javascripts/cartodb3/components/custom-list/custom-list-item.tpl');
var CustomListCollection = require('../../../../../../../javascripts/cartodb3/components/custom-list/custom-list-collection');
var CustomListItemView = require('../../../../../../../javascripts/cartodb3/components/custom-list/custom-list-item-view');

describe('components/form-components/editors/select/select-list-view', function () {
  var view;

  var createViewFn = function (options) {
    var collection = new CustomListCollection([], {});

    var itemView = new CustomListItemView({
      model: new Backbone.Model()
    });

    view = new SelectListView({
      collection: collection,
      itemTemplate: itemListTemplate,
      itemView: itemView
    });
  };

  beforeEach(function () {
    createViewFn();
    view.render();
  });

  afterEach(function () {
    view.clean();
  });

  it('should not have leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  describe('_toggleVisibility', function () {
    it('should render the overlay when visibility changes to true', function () {
      spyOn(view, '_renderOverlay');

      view.show();

      expect(view._renderOverlay).toHaveBeenCalled();
    });

    it('should remove the overlay when visibility changes to false', function () {
      view.model.set('visible', true, { silent: true });
      spyOn(view, '_destroyOverlay');

      view.hide();

      expect(view._destroyOverlay).toHaveBeenCalled();
    });
  });
});
