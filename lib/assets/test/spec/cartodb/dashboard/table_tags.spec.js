
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
  });

  it("should update table tags when tables model is updated from server", function() {
    spyOn(tagsView.model, 'fetch');
    tables.trigger('sync')
    expect(tagsView.model.fetch).toHaveBeenCalled();
  });

  // it should not, when a new table is added it has no tags, so it makes no sense to reload them
  xit("should update user tags when a table is added", function() {
    spyOn(tagsView.model, 'fetch');
    tables.add({id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'spec_jasmine', table_size: 100});

    expect(tagsView.model.fetch).toHaveBeenCalled();
  });
});
