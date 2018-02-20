var Backbone = require('backbone');
var _ = require('underscore');
var CustomListView = require('builder/components/custom-list/custom-list-view');
var CustomCollection = require('builder/components/custom-list/custom-list-collection');
var itemTemplate = require('builder/components/custom-list/custom-list-item.tpl');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');

describe('components/custom-list/custom-list-view', function () {
  var mouseOverAction;
  var mouseOutAction;

  beforeEach(function () {
    this.collection = new CustomCollection([
      {
        val: 'hello'
      }, {
        label: 'Hi',
        val: 'hi'
      }, {
        label: null,
        val: 'howdy'
      }, {
        label: 0,
        val: 'holi'
      }
    ]);

    mouseOverAction = jasmine.createSpy('mouseOverAction');
    mouseOutAction = jasmine.createSpy('mouseOutAction');

    this.view = new CustomListView({
      model: new Backbone.Model({ visible: true, query: '' }),
      collection: this.collection,
      typeLabel: 'column',
      itemView: CustomListItemView,
      itemTemplate: itemTemplate,
      mouseOverAction: mouseOverAction,
      mouseOutAction: mouseOutAction
    });
  });

  describe('with free text input', function () {
    beforeEach(function () {
      this.viewWithFreeText = new CustomListView({
        model: new Backbone.Model({ visible: true, query: 'tomato' }),
        collection: this.collection,
        typeLabel: 'column',
        itemView: CustomListItemView,
        itemTemplate: itemTemplate,
        allowFreeTextInput: true
      });
      spyOn(this.viewWithFreeText, '_applyCustomScroll');
      spyOn(this.viewWithFreeText, '_applyArrowBinds');
      spyOn(this.collection, 'search').and.callThrough();
      this.viewWithFreeText.render();
    });

    it('should render the add message when there are no items', function () {
      spyOn(this.collection, 'size').and.returnValue(0);
      this.viewWithFreeText.render();
      expect(this.viewWithFreeText.$el.text()).toContain('tomato');
      expect(this.viewWithFreeText.$el.text()).toContain('components.custom-list.add-custom-result');
    });
  });

  describe('render', function () {
    beforeEach(function () {
      jasmine.clock().install();
      spyOn(this.view, '_applyCustomScroll');
      spyOn(this.view, '_applyArrowBinds');
      spyOn(this.collection, 'search').and.callThrough();
      this.view.render();
    });

    it('should render empty message when there are no items', function () {
      spyOn(this.collection, 'size').and.returnValue(0);
      this.view.render();
      expect(this.view.$('.CustomList-message').length).toBe(1);
    });

    it('should render collection items', function () {
      expect(this.view.$('.js-list').length).toBe(1);
      expect(this.view.$('li').length).toBe(4);
      expect(this.view.$('li:eq(0)').text()).toContain('hello');
      expect(this.view.$('li:eq(1)').text()).toContain('Hi');
      expect(this.view.$('li:eq(2)').text()).toContain('howdy');
      expect(this.view.$('li:eq(3)').text()).toContain('0');
      expect(this.collection.search).toHaveBeenCalled();
    });

    it('should apply the custom scroll and the arrows binding', function () {
      jasmine.clock().tick(100);
      expect(this.view._applyCustomScroll).toHaveBeenCalled();
      expect(this.view._applyArrowBinds).toHaveBeenCalled();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
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

  it('should remove bindings properly', function () {
    spyOn(this.view, 'render');
    this.view.clean();
    dispatchDocumentEvent('keydown', { which: 40 });
    expect(this.view.render).not.toHaveBeenCalled();
  });

  it('should highlight selected value on show', function () {
    this.collection.at(2).set({ selected: true });
    this.view.render();
    this.view.highlight();
    expect(this.view.$('li:eq(2)').hasClass('is-highlighted')).toBeTruthy();
  });

  describe('mouseOverAction', function () {
    describe('._onMouseOver', function () {
      it('should trigger mouseOverAction', function () {
        this.view.render();

        this.view._onMouseOver();

        expect(mouseOverAction).toHaveBeenCalled();
      });
    });
  });

  describe('mouseOutAction', function () {
    describe('._onMouseOut', function () {
      it('should trigger mouseOutAction', function () {
        this.view.render();

        this.view._onMouseOut();

        expect(mouseOutAction).toHaveBeenCalled();
      });
    });
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
