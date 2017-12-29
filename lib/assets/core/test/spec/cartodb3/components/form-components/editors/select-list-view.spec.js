var Backbone = require('backbone');
var SelectListView = require('../../../../../../javascripts/cartodb3/components/form-components/editors/select/select-list-view');
var ItemTemplate = require('../../../../../../javascripts/cartodb3/components/custom-list/custom-list-item.tpl');
var CustomListItemView = require('../../../../../../javascripts/cartodb3/components/custom-list/custom-list-item-view');
var CustomListCollection = require('../../../../../../javascripts/cartodb3/components/custom-list/custom-list-collection');

describe('components/form-components/editors/select-list-view', function () {
  beforeEach(function () {
    this.mouseOverAction = jasmine.createSpy('mouseOverAction');
    this.mouseOutAction = jasmine.createSpy('mouseOutAction');

    var collection = new CustomListCollection();
    collection.stateModel = new Backbone.Model({
      state: 'fetching'
    });

    collection.isAsync = function () { return true; };

    this.view = new SelectListView({
      itemTemplate: ItemTemplate,
      itemView: CustomListItemView,
      collection: collection,
      mouseOverAction: this.mouseOverAction,
      mouseOutAction: this.mouseOutAction
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(this.view, '_renderListSection');

      this.view.render();

      expect(this.view._renderListSection).toHaveBeenCalled();
    });
  });

  describe('mouseOverAction', function () {
    describe('._onMouseOver', function () {
      it('should trigger mouseOverAction', function () {
        this.view.render();

        this.view._onMouseOver();

        expect(this.mouseOverAction).toHaveBeenCalled();
      });
    });
  });

  describe('mouseOutAction', function () {
    describe('._onMouseOut', function () {
      it('should trigger mouseOutAction', function () {
        this.view.render();

        this.view._onMouseOut();

        expect(this.mouseOutAction).toHaveBeenCalled();
      });
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
