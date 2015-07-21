var DeleteRowView = require('../../../../../../javascripts/cartodb/common/dialogs/delete_row/delete_row_view');

describe('common/dialogs/delete_row/delete_row_view', function() {
  beforeEach(function() {

    this.row = new cdb.admin.Row({
      cartodb_id: 100,
      the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
    });

    this.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    this.table.data().add(this.row);

    spyOn(this.row, 'destroy');

    this.view = new DeleteRowView({
      table: this.table,
      row: this.row
    });

    this.view.render();
  });

  it('should render the view', function() {
    expect(this.innerHTML()).toContain('Ok, delete');
    expect(this.innerHTML()).toContain("You are about to delete a row");
    expect(this.innerHTML()).toContain("Are you sure you want to delete it?");
  });

  describe('when click ok to delete row', function() {
    it('should call to destroy the model', function() {
      var server = sinon.fakeServer.create();
      server.respondWith("DELETE", "/api/v1/tables/" + this.table.get('name') + "/records/100", [ 204, { "Content-Type": "application/json" }, '' ]);

      var succeded = false;

      this.table.bind('removing:row', function() {
        succeded = true;
      });

      this.view.$('.ok').click();

      server.respond();
      expect(succeded).toBeTruthy();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
