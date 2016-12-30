var _ = require('underscore');
var OperatorsListView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/operators/operators-list-view');
var CustomListCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/operators/operators-list-collection');

describe('components/form-components/operators/operators-list-view', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    this.collection = new CustomListCollection([
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
    this.view = new OperatorsListView({
      attribute: '',
      operator: 'count',
      collection: this.collection
    });

    this.view.render();
  });

  it('should generate an internal model with the options', function () {
    expect(this.view.model).toBeDefined();
    var attrs = this.view.model.attributes;
    expect(attrs.operator).toBe('count');
    expect(attrs.attribute).toBe('');
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(this.view.$('.Editor-dropdownCalculations').length).toBe(1);
      expect(this.view.$('.Editor-dropdownCalculationsElement').length).toBe(5);
      expect(this.view.$('[name="operator"]').val()).toBe('count');
      expect(this.view._hasList()).toBeFalsy();
    });

    it('should render list when operator is different than count', function () {
      this.view.$('[value="avg"]').click().trigger('change');
      expect(this.view._hasList()).toBeTruthy();
      this.view.$('[value="count"]').click().trigger('change');
      expect(this.view._hasList()).toBeFalsy();
    });
  });

  describe('._onModelChange', function () {
    it('should trigger change when new value is selected and is valid', function () {
      spyOn(this.view, 'trigger');
      this.view.model.set({ operator: 'avg', attribute: '¥' });
      expect(this.view.trigger).toHaveBeenCalled();
    });

    it('should not trigger change when new value is selected and is not valid', function () {
      spyOn(this.view, 'trigger');
      this.view.model.set({ operator: 'avg', attribute: '' });
      expect(this.view.trigger).not.toHaveBeenCalled();
    });
  });

  it('should destroy list view when it is removed', function () {
    this.view.remove();
    expect(this.view._hasList()).toBeFalsy();
  });
});
