var DeleteColumnView = require('../../../../../../javascripts/cartodb/common/dialogs/delete_column/delete_column_view');

describe('common/dialogs/delete_column/delete_column_view', function() {
  beforeEach(function() {

    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'testTable',
      name: 'testTable',
      schema: [ ['cartodb_id', 'number'], ['test', 'string'], ['test1', 'number'], ['test2', 'boolean'], ['test3', 'date'], ['the_geom', 'geometry']],
      geometry_types: ['ST_MultiPoint'] 
    });

    this.columnName = "test";

    this.column = new cdb.admin.Column({
      table: this.table,
      name: this.columnName,
      type: "string"
    });

    spyOn(this.column, 'destroy');

    this.view = new DeleteColumnView({
      table: this.table,
      column: this.columnName
    });

    this.view.render();
  });

  it('should render the view', function() {
    expect(this.innerHTML()).toContain('Ok, delete');
    expect(this.innerHTML()).toContain("You are about to delete the '" + this.columnName + "' column");
    expect(this.innerHTML()).toContain("Are you sure you want to delete it?");
  });

  describe('when click ok to delete column', function() {
    it('should call to destroy the model', function() {
      var server = sinon.fakeServer.create();
      server.respondWith("DELETE", "/api/v1/tables/" + this.table.get('name') + "/columns/test",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);

      var succeded = false;

      this.table.bind('columnDelete', function() {
        succeded = true;
      });

      this.view.$('.ok').click();

      spyOn(this.table._data, 'fetch');
      server.respond();
      expect(succeded).toBeTruthy();
      expect(this.table._data.fetch).toHaveBeenCalled();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
