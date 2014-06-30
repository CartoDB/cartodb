describe("Tables view", function() {

  var view, tables, router, user, importer;

  beforeEach(function() {
    var $el = $('<div>');
    tables = new cdb.admin.Visualizations({ type: 'table' });
    router = new cdb.admin.dashboard.DashboardRouter();

    router.model.set('model', 'tables', { silent: true });

    user = TestUtil.createUser('test');
    importer = new cdb.ui.common.BackgroundImporter({ template_base: '' });

    // Setup all necessary table views
    view = new cdb.admin.dashboard.Tables({
      el:       $el,
      tables:   tables,
      user:     user,
      router:   router,
      config:   {},
      importer: importer
    });

  });

  it("should render properly", function() {
    expect(view.$('#tablelist').length).toBe(1);
    expect(view.$('aside').length).toBe(1);
    expect(view.$('.paginator').length).toBe(1);
    expect(view.$('aside ul li').length).toBe(3);
  });

  it("should setup user limits when user model or tables change", function() {
    spyOn(view, '_setupLimits');
    
    tables.reset([ generateTableData('table_name1', 'user1') ]);
    expect(view._setupLimits).toHaveBeenCalled();

    user.set(TestUtil.user_data);
    expect(view._setupLimits).toHaveBeenCalled();
  });

  it("should show create-dialog", function() {
    spyOn(view, 'trigger');
    view.$("aside .create_new").click();
    expect(view.trigger).toHaveBeenCalledWith('openCreateTableDialog');
  });

  it("should check create button when tables collection has being fetched", function() {
    spyOn(view, '_setCreateButton');
    tables.reset([ generateTableData('table_name1', 'user1') ]);
    expect(view._setCreateButton).toHaveBeenCalled();
  });

  it("should disable create-dialog bind if user reaches his/her limits", function() {
    user.set('table_count',100);
    tables.reset();
    expect(view.$("aside .create_new").hasClass('disabled')).toBeTruthy();
    spyOn(view, 'trigger');
    view.$("aside .create_new").click();
    expect(view.trigger).not.toHaveBeenCalled();
  });



  describe("Table list", function() {

    var tables, router, $el, user, view;

    beforeEach(function() {
      $el = $('<div>');
      tables = new cdb.admin.Visualizations({ type: 'table' });
      router = new cdb.admin.dashboard.DashboardRouter();
      user = TestUtil.createUser('test');

      // Tables list
      view = new cdb.admin.dashboard.TableList({
        el:         $el,
        collection: tables,
        router:     router,
        user:       user
      });
    });

    it("should render properly the table items", function() {
      tables.reset([ generateTableData('table_name1', 'user1') ]);
      expect(view.$('h3 a').text()).toBe('table_name1');
      expect(view.$('.privacy-status').hasClass('public')).toBeTruthy();
      expect(view.$('.table-shared').length).toBe(0);
      expect(view.$('.table-tags a').length).toBe(6);
      expect(view.$('.table-description').text()).toBe('Visualization description');
    });

    it("should render a table item with shared data", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;
      
      tables.reset([ generateTableData('table_name1', 'user1') ]);
      expect(view.$('.table-shared').length).toBe(1);
      expect(view.$('.table-shared .username').text()).toBe('user1');
      expect(view.$('.table-shared .avatar').attr('src')).toBe('http://test.com');
      expect(view.$('.privacy-status').hasClass('disabled')).toBeTruthy();
      expect(view.$('.delete.tooltip').length).toBe(0);
    });

    it("should navigate to a tag route when a tag is clicked", function() {
      // var called = 
      // tables.reset([ generateTableData('table_name1', 'user1') ]);
    });

    it("should show sync status when it is a synchronizable table", function() {
      
    });

    it("should open privacy dialog when click over the privacy icon", function() {
      
    });

    it("should render again with order changed when sort value changes", function() {
      
    });

    it("should set table link with prefix when user belongs to a organization", function() {
      
    });

  });



  // Utils
  function generateTableData(table_name, user_name) {
    return {
      map_id:           96,
      active_layer_id:  null,
      name:             table_name || "test_vis",
      description:      "Visualization description",
      tags:             ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9"],
      privacy:          "PUBLIC",
      created_at:       "2013-03-04T18:09:34+01:00",
      updated_at:       "2013-03-04T18:09:34+01:00",
      table: { id: 396, name: "untitled_table_9", privacy: "PRIVATE", row_count: 0, size: 16384, updated_at: "2013-03-04T18:09:34+01:00" },
      type:             "table",
      permission: {
        owner: { username: user_name || 'test', avatar_url: 'http://test.com', id: 'test'},
        acl: []
      }
    }
  }

});














// describe("Tables view", function() {

//   var tablesView, tables, user, sortable;

//   function trim(str) {
//     return str.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
//   }


//   afterEach(function() {
//     tablesView.clean();
//   });

//   beforeEach(function() {

//     var $el = $('<article class="tables"></articles>');
//     $el.appendTo($('body'));

//     createTable = function() {
//       return new cdb.admin.Visualization({
//         map_id:           96,
//         active_layer_id:  null,
//         name:             name || "test_vis",
//         description:      "Visualization description",
//         tags:             ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9"],
//         privacy:          "PUBLIC",
//         created_at:       "2013-03-04T18:09:34+01:00",
//         updated_at:       "2013-03-04T18:09:34+01:00",
//         table: { id: 396, name: "untitled_table_9", privacy: "PRIVATE", row_count: 0, size: 16384, updated_at: "2013-03-04T18:09:34+01:00" },
//         type:             "table",
//         permission: {
//           owner: { username: 'test', avatar_url: 'http://test.com', id: 'test'},
//           acl: []
//         }
//       });
//     }

//     var tablesCollection = [];

//     var n = 10;

//     for (var i = 0; i < n; i++) {
//       tablesCollection.push(createTable());
//     }

//     tables = new cdb.admin.Visualizations(tablesCollection, { type: "table" });
//     tables.total_entries = n;

//     this.$el = $('<div></div>');
//     this.$el.appendTo($('body'));

//     config    = TestUtil.config;
//     user_data = TestUtil.user_data;
//     user      = new cdb.admin.User(user_data);

//     tablesView = new cdb.admin.dashboard.Tables({
//       el:             this.$el,
//       tables:         tables,
//       user:           user,
//       config:         config,
//       importer:       null
//     });

//   });

//   it("should show the recent title", function() {
//     tables.options.set({ per_page: tables._PREVIEW_ITEMS_PER_PAGE });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();

//     expect(tablesView.$el.find("h2 span").text()).toEqual('Recent tables');
//   });

//   it("should show the created time by default", function() {
//     tables.options.set({ order: "created_at", per_page: tables._ITEMS_PER_PAGE });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();
//     expect($(tablesView.$el.find("p.time.smaller.light")[0]).text()).toEqual("created " + moment("2013-03-04T18:09:34+01:00").fromNow());
//   });

//   it("should show the updated time by default", function() {
//     tables.options.set({ order: "updated_at", per_page: tables._ITEMS_PER_PAGE });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();
//     expect($(tablesView.$el.find("p.time.smaller.light")[0]).text()).toEqual("updated " + moment("2013-03-04T18:09:34+01:00").fromNow());
//   });

//   it("should show the default title", function() {
//     tables.options.set({ per_page: tables._ITEMS_PER_PAGE });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();
//     expect(tablesView.$el.find("h2 span").text()).toEqual(tables.length + ' tables created');
//   });

//   it("should show that there are no results", function() {
//     tables.total_entries = 0;
//     tables.options.set({ per_page: tables._ITEMS_PER_PAGE, q: "abcdefg" });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();
//     expect(tablesView.$el.find("h2 span").text()).toEqual('0 tables with abcdefg found');
//   });

//   it("shouldn't show the view_all link when showing the deafult amount of items", function() {
//     tables.options.set({ per_page: tables._ITEMS_PER_PAGE });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();
//     expect(tablesView.$el.hasClass("view_all")).toBeFalsy();
//   });

//   it("should show the view_all link", function() {
//     tables.options.set({ per_page: tables._PREVIEW_ITEMS_PER_PAGE });
//     tablesView._setupTablesView();
//     tablesView.tableList.render();
//     expect(tablesView.$el.hasClass("view_all")).toBeTruthy();
//   });

//   describe("Tags", function() {

//     it("should show 6 tags max and show that there're more", function() {

//       tablesView._setupTablesView();
//       tablesView.tableList.render();

//       var $tags = $(tablesView.$el.find(".tags")[0]);
//       expect(trim($tags.text())).toEqual("tag6 tag5 tag4 tag3 tag2 tag1");
//       expect($(tablesView.$el.find(".more")[0]).text()).toEqual("3 more tags");

//     });

//     it("should show the tag that the user searched for (even if it's not in the sliced list of tags)", function() {
//       tables.options.set({ q: "", tags: "tag9", per_page: tables._TABLES_PER_PAGE });

//       tablesView._setupTablesView();
//       tablesView.tableList.render();

//       var $tags = $(tablesView.$el.find(".tags")[0]);
//       expect(trim($tags.text())).toEqual("tag9 tag5 tag4 tag3 tag2 tag1");

//       expect($(tablesView.$el.find(".more")[0]).text()).toEqual("3 more tags");
//     });

//     it("should show the tag that the user searched for", function() {
//       tables.options.set({ q: "", tags: "tag5", per_page: tables._TABLES_PER_PAGE });

//       tablesView._setupTablesView();
//       tablesView.tableList.render();

//       var $tags = $(tablesView.$el.find(".tags")[0]);
//       expect(trim($tags.text())).toEqual("tag6 tag5 tag4 tag3 tag2 tag1");

//       expect($(tablesView.$el.find(".more")[0]).text()).toEqual("3 more tags");
//     });

//     it("should render the tag title", function() {

//       tables.options.set({ q: "", tags: "tag3", per_page: tables._TABLES_PER_PAGE });
//       tablesView._setupTablesView();
//       tablesView.tableList.render();

//       expect(tablesView.$el.find("h2 span").text()).toEqual(tables.length + ' tables with the tag tag3');
//     });

//     it("should trigger an event when a tag is removed", function() {

//       tables.options.set({ q: "", tags: "tag3", per_page: tables._TABLES_PER_PAGE });
//       tablesView._setupTablesView();
//       tablesView.tableList.render();

//       var spy = spyOn(tablesView, "trigger");
//       $(tablesView.$el.find(".remove")[0]).click();

//       expect(spy).toHaveBeenCalledWith("removeTag", tablesView);

//     });

//   });

// });
