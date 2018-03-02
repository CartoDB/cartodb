var _ = require('underscore');
var $ = require('jquery');
var OperatorsListView = require('builder/components/form-components/editors/operators/operators-list-view');
var CustomListCollection = require('builder/components/form-components/editors/operators/operators-list-collection');

describe('components/form-components/operators/operators-list-view', function () {
  var view, collection;

  var createViewFn = function () {
    collection = new CustomListCollection([
      {
        val: '$',
        type: 'number'
      }, {
        val: '€',
        type: 'number'
      }, {
        val: '¥',
        type: 'number'
      }
    ]);

    var view = new OperatorsListView({
      attribute: '',
      operator: 'count',
      collection: collection
    });

    return view;
  };

  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    view = createViewFn();
    view.render();
  });

  afterEach(function () {
    view.clean();
  });

  it('should generate an internal model with the options', function () {
    expect(view.model).toBeDefined();
    var attrs = view.model.attributes;
    expect(attrs.operator).toBe('count');
    expect(attrs.attribute).toBe('');
  });

  it('should destroy list if hidden', function () {
    spyOn(view, '_destroyList');
    spyOn(view, 'remove');
    // To force a change
    view.model.unset('visible');
    view.model.set('visible', false);

    expect(view._destroyList).toHaveBeenCalled();
    expect(view.remove).not.toHaveBeenCalled();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(view.$('.Editor-dropdownCalculations').length).toBe(1);
      expect(view.$('.Editor-dropdownCalculationsElement').length).toBe(5);
      expect(view.$('[name="operator"]').val()).toBe('count');
      expect($('.CDB-Box-modalOverlay').length).toBe(1);
      expect(_.size(view._subviews)).toBe(1);
      expect(view._hasList()).toBeFalsy();
    });

    it('should render list when operator is different than count', function () {
      view.$('[value="avg"]').click().trigger('change');
      expect(view._hasList()).toBeTruthy();
      view.$('[value="count"]').click().trigger('change');
      expect(view._hasList()).toBeFalsy();
    });
  });

  describe('._onModelChange', function () {
    it('should trigger change when new value is selected and is valid', function () {
      spyOn(view, 'trigger');
      view.model.set({ operator: 'avg', attribute: '¥' });
      expect(view.trigger).toHaveBeenCalled();
    });

    it('should not trigger change when new value is selected and is not valid', function () {
      spyOn(view, 'trigger');
      view.model.set({ operator: 'avg', attribute: '' });
      expect(view.trigger).not.toHaveBeenCalled();
    });
  });

  it('should destroy list view when it is removed', function () {
    view.remove();
    expect(view._hasList()).toBeFalsy();
  });
});
