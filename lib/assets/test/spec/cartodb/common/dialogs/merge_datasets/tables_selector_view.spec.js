var cdb = require('cartodb.js-v3');
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
    expect(this.innerHTML()).toContain('disabled');
  });

  describe('when initialOption is given', function() {
    beforeEach(function() {
      this.view.clean();
      this.view = new TablesSelectorView({
        initialOption: {
          label: 'foo',
          value: 'bar'
        }
      });
      this.view.render();
    });

    it('should have the initial option as first option', function() {
      var $option = this.view.$('option').first();
      expect($option.text()).toEqual('foo');
      expect($option.val()).toEqual('bar');
    });
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
      expect(this.view.model.get('tableData').id).toEqual('tableA');
    });

    describe('when a table matches exclude filter', function() {
      beforeEach(function() {
        this.view.options.excludeFilter = function(vis) {
          return vis.get('name') === 'tablex';
        };
        this.view.model.get('visualizations').reset([
          new cdb.admin.Visualization({
            id: 'x',
            name: 'tablex'
          }),
          new cdb.admin.Visualization({
            id: 'abc123',
            type: 'table',
            name: 'table_a',
            table: {
             id: 'tableA'
            }
          })
        ]);
      });

      it('should pre-select first table that is not matching filter', function() {
        expect(this.view.model.get('tableData').id).toEqual('tableA');
      });
    });

    describe('when selecting another table', function() {
      beforeEach(function() {
        // Could not figure out how to trigger it through the native DOM
        this.view.trigger('change', 'cde345');
      });

      it('should set the models table data', function() {
        expect(this.view.model.get('tableData').id).toEqual('tableB');
      });
    });
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });
});
