
describe("Export table", function() {
  var export_dialog, sqlView, table;
  beforeEach(function() {
    table = TestUtil.createTable('test');

    export_dialog = new cdb.admin.ExportTableDialog({
      model: table,
      config: {
        "sql_api_protocol":"http",
        "sql_api_domain":"admin.localhost.lan",
        "sql_api_endpoint":"/api/v1/sql",
        "sql_api_port":8080
      },
      user_data: {
        api_key: 'ciruelo_big_key'
      }
    });
  });

  it("should open the export dialog", function() {
    export_dialog.render();
    expect(export_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Select your file type');
    expect(export_dialog.$el.find(".modal:eq(0) nav a").size()).toEqual(5);
  });

});