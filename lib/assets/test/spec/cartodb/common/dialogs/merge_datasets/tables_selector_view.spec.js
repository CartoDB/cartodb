var cdb = require('cartodb.js');
var TablesSelectorView = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/tables_selector_view');

describe('common/dialog/merge_datasets/tables_selector_view', function() {
  beforeEach(function() {
    spyOn(cdb.admin.Visualizations.prototype, 'fetch');
    this.view = new TablesSelectorView({
    });
    this.view.render();
  });

  it('should fetch tables on startup', function() {
    expect(cdb.admin.Visualizations.prototype.fetch).toHaveBeenCalled();
  });

  it('should be disabled initially', function() {
    expect(this.view.$el.prop('disabled')).toBeTruthy();
  });

  describe('when tables are fetched', function() {
    beforeEach(function() {
      this.view.model.get('visualizations').reset([
        new cdb.admin.Visualization({
          id: 'abc123',
          type: 'table',
          name: 'table_a',
          table: {
            id: 'tableA'
          }
        }),
        new cdb.admin.Visualization({
          id: 'cde345',
          type: 'table',
          name: 'table_b',
          table: {
            id: 'tableB'
          }
        })
      ]);
    });

    it('should enable the selector', function() {
      expect(this.view.$el.prop('disabled')).toBeFalsy();
    });

    it('should pre-select first table', function() {
      expect(this.view.$el.val()).toEqual('abc123');
      expect(this.view.model.get('tableData').id).toEqual('tableA');
    });

    describe('when selecting another table', function() {
      beforeEach(function() {
        this.selectSpy = jasmine.createSpy('select change');
        this.view.model.bind('change:tableData', this.selectSpy);
        this.view.$el.children().last().prop('selected', true);
        this.view.$el.trigger('change');
      });

      it('should set the models table data', function() {
        expect(this.selectSpy).toHaveBeenCalled();
        expect(this.view.model.get('tableData').id).toEqual('tableB');
      });
    });
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });
});
