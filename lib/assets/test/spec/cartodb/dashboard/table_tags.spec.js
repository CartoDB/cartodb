
 describe("cdb.admin.dashboard.TagsView", function() {
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
    for(var i = 0; i < tables._TABLES_PER_PAGE; i++) {
      tableArray.push({id: i, name: 'test'+i, privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'});
    }

    this.server.respondWith("GET", "irrelevant.json",
                                [200, { "Content-Type": "application/json" },
                                 '{"total_entries":'+(tables._TABLES_PER_PAGE+2)+', "tables": '+JSON.stringify(tableArray)+'}']);


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

  it("should render", function() {
    var container = $('<div></div>');
    container.appendTo($("body"));
    tagsView.el = container;
    tagsView.$el = $(container);
    tagsView.render();
    expect(container.html()).toBeTruthy();
    container.remove();
  });
  it("should not render 'view_all' button if there aren't enough tags", function() {
    var container = $('<div></div>');
    container.appendTo($("body"));
    tagsView.el = container;
    tagsView.$el = $(container);

    tagsView.render();

    expect(container.find('li.view_all a').length).toBeFalsy()
    container.remove();
  })
  it("should not render 'view_all' button if there aren't enough tags", function() {
    var container = $('<div></div>');
    container.appendTo($("body"));
    tagsView.el = container;
    tagsView.$el = $(container);

    tagsView.render();

    expect(container.find('li.view_all a').length).toBeFalsy()
    container.remove();
  })
  it("should render 'view_all' button if there are enough tags", function() {
    var container = $('<div></div>');
    container.appendTo($("body"));
    for(var i = 0; i <= tagsView._TAG_AMOUNT; i++ ) {
      tags.set(i, {'name': i, 'count': 1})
    }
    tagsView.el = container;
    tagsView.$el = $(container);

    tagsView.render();

    console.log(tagsView);

    expect(container.find('li.view_all a').length).toBeTruthy()
    container.remove();
  })

   it("should show a dialog with all the available tags", function() {
     var container = $('<div></div>');
     container.appendTo($("body"));
     for(var i = 0; i <= tagsView._TAG_AMOUNT; i++ ) {
       tags.set(i, {'name': i, 'count': 1})
     }
     tagsView.el = container;
     tagsView.$el = $(container);

     tagsView.render();

     tagsView._showAllTags();

     expect(tagsView.dialog).toBeTruthy();
     tagsView.dialog.remove();
     container.remove();

   });
 });
