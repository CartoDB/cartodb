var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var MergeStepModel = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_step_model');

/**
 * Tests the flow of a spatial merge from start to end
 */
describe('common/dialog/merge_datasets/spatial_merge', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com'
    });
    this.sql = 'SELECT something from SOMEWHERE' // given from prev stpe
    this.model = new MergeStepModel({
      user: this.user,
      tableName: 'table_name',
      sql: this.sql
    });
    spyOn($, 'ajax');
    this.view = this.model.createView();
    this.view.render();
  });

  it('should render the loading screen', function() {
    expect(this.innerHTML()).toContain('Spinner');
    expect(this.innerHTML()).toContain('Merging datasets');
    expect(this.innerHTML()).not.toContain('Step');
  });

  it('should do merge directly', function() {
    expect($.ajax).toHaveBeenCalled();
    expect($.ajax.calls.argsFor(0)[0].data).toEqual(jasmine.any(Object));
    expect($.ajax.calls.argsFor(0)[0].data.table_name).toEqual('table_name_merge');
    expect($.ajax.calls.argsFor(0)[0].data.sql).toEqual(this.sql);
  });

  afterEach(function() {
    this.view.clean();
  });
});
