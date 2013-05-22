
describe("DashboardPaginator", function() {
  var paginator
    , tables;

  beforeEach(function() {
    tables = new cdb.admin.Tables();
    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    // Choose scenario
    paginator = new cdb.admin.DashboardPaginator({
      items: tables,
      what: "tables",
      el: this.el
    });

    this.createLotsOfTables = function() {
      var newTables = []
      for(var i = 1; i < tables.options.get('per_page')*1.6; i++) {
        newTables.push({id: i, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'})
      }
      tables.reset(newTables);
      tables.total_entries = newTables.length;
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

  it("should render pages on paginator when needed", function() {
    this.createLotsOfTables();

    paginator.render();

    expect(paginator.$('.page').length).toEqual(4);
    expect(paginator.$('.prev').length).toEqual(1);
    expect(paginator.$('.next').length).toEqual(1);
  });

  it("should trigger event on page click", function() {

    this.createLotsOfTables();
    paginator.render();
    paginator.cancelClicks = true;

    var clicked = false;

    paginator.bind('loadingPage', function() {
      clicked = true;
    });

    console.log(paginator.$el);
    paginator.$('a').eq(1).click();
    expect(clicked).toBeTruthy();

  });

});
