
describe("table-tags", function() {
  var tags
    , tables
    , user
    , tagsView;

  beforeEach(function() {
    tables = new cdb.admin.Tables();
    user = new cdb.admin.User({ id : "1" });
    tags = new cdb.admin.Tags();

    tagsView = new cdb.admin.dashboard.TagsView({
      tables: tables,
      model: tags
    });

    tagsView.model.fetch = function() { }

    this.server = sinon.fakeServer.create();
    var tableArray = [];
    for(var i = 0; i < _TABLES_PER_PAGE; i++) {
      tableArray.push({id: i, name: 'test'+i, privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'});
    }

    this.server.respondWith("GET", "irrelevant.json",
                                [200, { "Content-Type": "application/json" },
                                 '{"total_entries":'+(_TABLES_PER_PAGE+2)+', "tables": '+JSON.stringify(tableArray)+'}']);


  });

  it("should update table tags when tables model is updated from server", function() {
    spyOn(tagsView.model, 'fetch');
    tables.trigger('reset')
    expect(tagsView.model.fetch).toHaveBeenCalled();
  });

  it("should update user tags when a table is removed", function() {
    spyOn(tagsView.model, 'fetch');
    tables.trigger('remove')

    expect(tagsView.model.fetch).toHaveBeenCalled();
  });
});
