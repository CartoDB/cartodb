
describe("dashboard-paginator", function() {
  var paginator
    , tables;

  beforeEach(function() {
    tables = new cdb.admin.Tables();
    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    // Choose sceneario
    paginator = new cdb.admin.dashboard.DashboardPaginator({
      model: tables,
      el: this.el
    });

    this.createLotsOfTables = function() {
      tables.reset([
        {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 2, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 3, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 4, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 5, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 6, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 7, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 8, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 11, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 12, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 13, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 14, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 15, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 16, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 17, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
        {id: 18, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
      ]);
      tables.total_entries = 16;
    }
  });



  it("should render the paginator", function() {
    spyOn(paginator, 'render');
    tables.reset([{name : "jamon"}]);
    expect(paginator.render).toHaveBeenCalled();
  });

  it("should render again the paginator after remove a table", function() {
    tables.add({id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100});
    spyOn(paginator, 'render');
    tables.pop();
    expect(paginator.render).toHaveBeenCalled();
  });

  it("should render again the paginator after add a new table", function() {
    spyOn(paginator, 'render');
    tables.add({id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100});
    expect(paginator.render).toHaveBeenCalled();
  });

  it("should render pages on paginator when neeeded", function() {
    this.createLotsOfTables();
    paginator.render();
    expect(paginator.$('a').length).toEqual(2);
  });

  it("should trigger event on page click", function() {
    this.createLotsOfTables();
    paginator.render();
    paginator.cancelClicks = true;
    var clicked = false;
    paginator.bind('loadingPage', function() {
      clicked = true;
    })
    paginator.$('a').eq(1).click();
    expect(clicked).toBeTruthy();
  })
});
