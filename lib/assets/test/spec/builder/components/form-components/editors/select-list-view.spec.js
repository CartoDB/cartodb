var _ = require('underscore');
var Backbone = require('backbone');
var SelectListView = require('builder/components/form-components/editors/select/select-list-view');
var ItemTemplate = require('builder/components/custom-list/custom-list-item.tpl');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');

describe('components/form-components/editors/select-list-view', function () {
  var mouseOverAction;
  var mouseOutAction;

  var createViewFn = function (options) {
    mouseOverAction = jasmine.createSpy('mouseOverAction');
    mouseOutAction = jasmine.createSpy('mouseOutAction');

    var collection = new CustomListCollection();
    collection.stateModel = new Backbone.Model({
      state: 'fetching'
    });

    collection.isAsync = function () { return true; };
    var defaultOptions = {
      itemTemplate: ItemTemplate,
      itemView: CustomListItemView,
      collection: collection,
      mouseOverAction: mouseOverAction,
      mouseOutAction: mouseOutAction
    };

    var view = new SelectListView(_.extend(defaultOptions, options));

    return view;
  };

  describe('.render', function () {
    it('should render properly', function () {
      var view = createViewFn();
      spyOn(view, '_renderListSection');

      view.render();

      expect(view._renderListSection).toHaveBeenCalled();
    });
  });

  describe('mouseOverAction', function () {
    describe('._onMouseOver', function () {
      it('should trigger mouseOverAction', function () {
        var view = createViewFn();

        view.render();
        view._onMouseOver();

        expect(mouseOverAction).toHaveBeenCalled();
      });
    });
  });

  describe('mouseOutAction', function () {
    describe('._onMouseOut', function () {
      it('should trigger mouseOutAction', function () {
        var view = createViewFn();

        view.render();
        view._onMouseOut();

        expect(mouseOutAction).toHaveBeenCalled();
      });
    });
  });

  it('should have no leaks', function () {
    var view = createViewFn();

    expect(view).toHaveNoLeaks();
  });
});
