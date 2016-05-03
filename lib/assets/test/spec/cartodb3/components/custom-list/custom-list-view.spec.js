var Backbone = require('backbone');
var _ = require('underscore');
var CustomListView = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-view');
var CustomCollection = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-collection');
var itemTemplate = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-item.tpl');
var CustomListItemView = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-item-view');

describe('components/custom-list/custom-list-view', function () {
  beforeEach(function () {
    this.collection = new CustomCollection([
      {
        val: 'hello'
      }, {
        val: 'hi'
      }, {
        val: 'howdy'
      }
    ]);

    this.view = new CustomListView({
      model: new Backbone.Model({ visible: true, query: '' }),
      collection: this.collection,
      typeLabel: 'column',
      ItemView: CustomListItemView,
      itemTemplate: itemTemplate
    });
  });

  describe('render', function () {
    beforeEach(function () {
      spyOn(this.view, '_applyCustomScroll');
      spyOn(this.view, '_applyArrowBinds');
      spyOn(this.collection, 'search').and.callThrough();
      this.view.render();
    });

    it('should render empty message when there is no items', function () {
      spyOn(this.collection, 'size').and.returnValue(0);
      this.view.render();
      expect(this.view.$('.CustomList-message').length).toBe(1);
    });

    it('should render collection items', function () {
      expect(this.view.$('.js-list').length).toBe(1);
      expect(this.view.$('li').length).toBe(3);
      expect(this.collection.search).toHaveBeenCalled();
    });

    it('should apply the custom scroll and the arrows binding', function () {
      expect(this.view._applyCustomScroll).toHaveBeenCalled();
      expect(this.view._applyArrowBinds).toHaveBeenCalled();
    });
  });

  describe('arrow + ENTER bindings', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should highlight next (first) item when arrow key is pressed', function () {
      dispatchDocumentEvent('keydown', { which: 40 });
      expect(this.view.$('.is-highlighted').length).toBe(1);
      expect(this.view.$('li:eq(0)').hasClass('is-highlighted')).toBeTruthy();
    });

    it('should highlight prev (last) item when arrow key is pressed', function () {
      for (var i = 0, l = 3; i<l; i++) { // eslint-disable-line
        dispatchDocumentEvent('keydown', { which: 40 });
      }
      dispatchDocumentEvent('keydown', { which: 38 });
      expect(this.view.$('.is-highlighted').length).toBe(1);
      expect(this.view.$('li:eq(1)').hasClass('is-highlighted')).toBeTruthy();
    });

    it('should select current highlighed item when ENTER is pressed', function () {
      for (var i = 0, l = 2; i<l; i++) { // eslint-disable-line
        dispatchDocumentEvent('keydown', { which: 40 });
      }
      expect(this.view.$('li:eq(1)').hasClass('is-highlighted')).toBeTruthy();
      var selectedItem = _.first(this.collection.where({ val: this.view.$('li:eq(1)').data('val') }));
      expect(selectedItem.get('selected')).toBeFalsy();
      dispatchDocumentEvent('keydown', { which: 13 });
      expect(selectedItem.get('selected')).toBeTruthy();
    });
  });


  it('should remove bindings when view is cleaned', function () {
    spyOn(this.view, '_removeArrowBinds');
    spyOn(this.view, '_destroyCustomScroll');
    this.view.clean();
    expect(this.view._removeArrowBinds).toHaveBeenCalled();
    expect(this.view._destroyCustomScroll).toHaveBeenCalled();
  });


  function dispatchDocumentEvent (type, opts) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, false, true);
    if (opts.which) {
      e.which = opts.which;
    }
    document.dispatchEvent(e, opts);
  }
});
