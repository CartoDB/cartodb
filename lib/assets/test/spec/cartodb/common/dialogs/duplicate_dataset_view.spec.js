var DuplicateDatasetView = require('../../../../../javascripts/cartodb/common/dialogs/duplicate_dataset_view');
var cdb = require('cartodb.js');

describe('common/dialogs/duplicate_dataset_view', function() {

  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      type: 'table',
      name: 'my name',
      table: {
        name: 'table_name'
      }
    });
    this.table = this.vis.tableMetadata();
    this.user = jasmine.createSpy('cdb.admin.User');

    spyOn(this.table, 'duplicate');
    spyOn(this.vis, 'isVisualization');

    this.view = new DuplicateDatasetView({
      model: this.vis,
      table: this.vis.tableMetadata(),
      user: this.user
    });
    this.view.render();
  });

  it('should start the duplication process right away with creating an import', function() {
    expect(this.table.duplicate).toHaveBeenCalled();
    expect(this.table.duplicate.calls.argsFor(0)[0]).toEqual('table_name_copy');
  });

  it('should render the loading initially', function() {
    expect(this.innerHTML()).toContain('Duplicating your dataset');
  });

  describe('when duplication finishes successfully', function() {

    beforeEach(function() {
      var newTable = jasmine.createSpyObj('table', ['viewUrl']);
      newTable.viewUrl.and.returnValue('http://cartodb.com/user/pepe/table/my_table_copy');
      spyOn(this.view, '_redirectTo');
      this.table.duplicate.calls.argsFor(0)[1].success(newTable);
    });

    it("should redirect to the new table's edit page", function() {
      expect(this.view._redirectTo).toHaveBeenCalledWith('http://cartodb.com/user/pepe/table/my_table_copy');
    });
  });

  describe('when duplicates fails', function() {

    beforeEach(function() {
      this.table.duplicate.calls.argsFor(0)[1].error();
    });

    it('should render the fail view', function() {
      expect(this.innerHTML()).toContain('Sorry, something went wrong');
    });
  });
});
