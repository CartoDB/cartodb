
describe("tables-list", function() {
  var tablelist
    , tables
    , user;

  beforeEach(function() {

    cdb.templates.add(new cdb.core.Template({
      name: 'dashboard/views/table_list_item',
      compiled: _.template('')
    }));

    tables = new cdb.admin.Tables();
    tables.url = function(){ return 'irrelevant.json'};

    user = new cdb.admin.User({ id : "1" });

    tablelist = new cdb.admin.dashboard.TableList({
      model: tables,
      user: user
    });

    this.server = sinon.fakeServer.create();
    var tableArray = [];
    for(var i = 0; i < 10; i++) {
      tableArray.push({id: i, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'});
    }

    this.server.respondWith("GET", "irrelevant.json",
                                [200, { "Content-Type": "application/json" },
                                 '{"total_entries":12, "tables": '+JSON.stringify(tableArray)+'}']);

  });

  afterEach(function() {
    this.server.restore();
  })

  it("should update header on reset", function() {
    spyOn(tablelist, '_updateListHeader');
    tables.reset([
      {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'}
    ]);
    expect(tablelist._updateListHeader).toHaveBeenCalled();
  });

  it("should render tables on reset", function() {
    tables.reset([
      {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
      {id: 2, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'}
    ]);
    expect(tablelist.$('li').length).toEqual(2);
  });

  it()


  it("should fill with tables when you fetch the model", function() {
    tables.reset();
    tables.fetch();
    this.server.respond();
    tables.trigger('forceReload');

    expect(tablelist.$('li').length).toEqual(10);
  });

  it("should fill with tables when you delete one and there are more pages", function() {
    tables.reset();
    tables.fetch();
    this.server.respond();
    tables.trigger('forceReload');
    var li = tables.models[9];
    tables.remove(li);
    tablelist.render();
    expect(tablelist.$('li').length).toEqual(9);
    tablelist.refreshTable();
    this.server.respond();
    expect(tablelist.$('li').length).toEqual(10);
  });

  it("should check if the table list is full", function() {
    expect(tablelist.checkTableListFull()).toBeTruthy();
  })

  it("should check if the table list is not full and has more records not shown", function() {
    tables.reset();
    tables.fetch();
    this.server.respond();
    var li = tables.models[9];
    tables.remove(li);
    expect(tablelist.checkTableListFull()).toBeFalsy();
  })

  it("should be able to append a view for the n model of the collection", function() {
    tables.reset();
    tables.fetch();
    this.server.respond();
    var li = tables.models[9];
    tables.remove(li);
    tablelist.render();
    tables.fetch();
    this.server.respond();
    tablelist.appendTableByNumber(9);

    expect(tablelist.$('li').length).toEqual(10);
  })

});
