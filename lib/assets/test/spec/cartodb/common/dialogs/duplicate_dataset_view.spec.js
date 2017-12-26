var DuplicateDatasetView = require('../../../../../javascripts/cartodb/common/dialogs/duplicate_dataset_view');
var cdb = require('cartodb.js-v3');

describe('common/dialogs/duplicate_dataset_view', function() {

  beforeEach(function() {
    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'table_id',
      name: 'table_name'
    });

    this.user = jasmine.createSpy('cdb.admin.User');

    spyOn(this.table, 'duplicate');

    this.view = new DuplicateDatasetView({
      model: this.table,
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

  it('should render alternative title if creating from SQL', function() {
    spyOn(this.table, 'isInSQLView').and.returnValue(true);
    this.view.initialize();
    this.view.render();
    expect(this.innerHTML()).not.toContain('Duplicating your dataset');
    expect(this.innerHTML()).toContain('Creating dataset from your query');
  });

  describe('when duplication finishes successfully', function() {

    beforeEach(function() {
      var newTable = jasmine.createSpyObj('table', ['viewUrl']);
      newTable.viewUrl.and.returnValue('https://carto.com/user/pepe/table/my_table_copy');
      spyOn(this.view, '_redirectTo');
      this.table.duplicate.calls.argsFor(0)[1].success(newTable);
    });

    it("should redirect to the new table's edit page", function() {
      expect(this.view._redirectTo).toHaveBeenCalledWith('https://carto.com/user/pepe/table/my_table_copy');
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
