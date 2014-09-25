
describe("Background view", function() {

  var table, server, view;

  beforeEach(function() {
    cdb.config.set({
      sql_api_port: 80,
      sql_api_domain: 'cartodb.com',
      sql_api_endpoint: '/api/v1/sql'
    });
    
    table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['cartodb_georef_status', "boolean"]]);

    view = new cdb.admin.BackgroundTab({
      el: $('<div>'),
      model: new cdb.admin.Geocoding(),
      vis: new cdb.admin.Visualization(),
      table: table,
      globalError: new cdb.admin.GlobalError({ el: $('<div>') }),
      user: TestUtil.createUser('test')
    });

    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
    view.model.dlg && view.model.dlg.hide();
  });

  it("should generate background-geocoder", function() {
    view.render();
    expect(view.$('.background_importer').length).toBe(1);
  });

  it("should start poll checking when kind has changed", function() {
    view.render();
    spyOn(view.model, 'pollCheck');
    
    view.model.set({
      table_name: 'test',
      kind: 'test',
      formatter:'{test_column}'
    });

    server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id:666, state:"", table_name:"test", processed_rows:0, total_rows:10 }) );

    expect(view.model.pollCheck).toHaveBeenCalled();
    view.model.destroyCheck();
  });

  it("should fecth user model when geocoding process has finished", function() {
    view.render();
    spyOn(view.user, 'fetch');

    view.model.set({
      table_name: 'test',
      kind: 'test',
      formatter:'{test_column}'
    });

    server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id:666, state:"finished", table_name:"test", processed_rows:0, total_rows:10 }) );

    expect(view.user.fetch).toHaveBeenCalled();
    view.model.destroyCheck();
  });

  it("should fetch user model when geocoder process fails", function() {
    view.render();
    spyOn(view.user, 'fetch');

    view.model.set({
      table_name: 'test',
      kind: 'test',
      formatter:'{test_column}'
    });

    server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id:666, state:"failed", table_name:"test", processed_rows:0, total_rows:10 }) );

    expect(view.user.fetch).toHaveBeenCalled();
    view.model.destroyCheck();
  });

});
