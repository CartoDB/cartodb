var TableHeadOptionsItemView = require('builder/components/table/head/table-head-options-item-view');
var tableHeadOptionsItemTemplate = require('builder/components/table/head/table-head-options-item.tpl');
var CustomListItemModel = require('builder/components/custom-list/custom-list-item-model');

describe('components/table/head/table-head-options-item-view', function () {
  beforeEach(function () {
    this.model = new CustomListItemModel({
      label: 'cartodb_id',
      type: 'number',
      isLastColumns: false,
      val: 'change'
    });
    this.view = new TableHeadOptionsItemView({
      model: this.model,
      template: tableHeadOptionsItemTemplate
    });
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should be rendered properly', function () {
      expect(this.view.$('.CDB-ListDecoration-itemLink').length).toBe(1);
    });

    it('should render order with both order ways, asc and desc', function () {
      this.model.set('val', 'order');
      this.view.render();
      expect(this.view.$('.js-asc').length).toBe(1);
      expect(this.view.$('.js-desc').length).toBe(1);
    });

    it('should render change an arrow at the end', function () {
      this.model.set('val', 'change');
      this.view.render();
      expect(this.view.$('.CDB-IconFont-rArrowLight').length).toBe(1);
    });
  });

  describe('bind', function () {
    it('should open sub menu if option is change', function () {
      this.model.set('val', 'change');
      spyOn(this.view, '_openSubContextMenu');
      this.view.render();
      this.view.$el.click();
      expect(this.view._openSubContextMenu).toHaveBeenCalled();
      expect(this.model.get('selected')).toBeFalsy();
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
