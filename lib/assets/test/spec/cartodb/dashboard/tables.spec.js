describe("Dashboard tables view", function() {

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
    
    tables.reset([ generateTableData('table_name1', 'test') ]);
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
    tables.reset([ generateTableData('table_name1', 'test') ]);
    expect(view._setCreateButton).toHaveBeenCalled();
  });

  it("should disable create-dialog bind if user reaches his/her limits", function() {
    user.set('table_count', user.get('table_quota'));
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
      tables.reset([ generateTableData('table_name1', 'test') ]);
      expect(view.$('h3 a').text()).toBe('table_name1');
      expect(view.$('.privacy-status').hasClass('public')).toBeTruthy();
      expect(view.$('.privacy-status span').length).toBe(0);
      expect(view.$('.table-shared').length).toBe(0);
      expect(view.$('.table-tags a').length).toBe(6);
      expect(view.$('.table-order span').text().search('Created')).not.toBe(-1)
      expect(view.$('.table-description').text()).toBe('Visualization description');
    });

    it("should render a table item with shared data, being owner", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;
      
      tables.reset([ generateTableData('table_name1', 'test') ]);
      expect(view.$('.table-shared').length).toBe(1);
      expect(view.$('.table-shared .username').text()).toBe('You');
      expect(view.$('.table-shared .avatar').attr('src')).toBe('http://test.com');
      expect(view.$('.privacy-status').hasClass('disabled')).toBeFalsy(); // You are the owner
      expect(view.$('.delete.tooltip').length).toBe(1);
    });

    it("should render a table item with shared data, not being owner", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;
      
      tables.reset([ generateTableData('table_name1', 'user2', 3) ]);
      expect(view.$('.table-shared').length).toBe(1);
      expect(view.$('.table-shared .username').text()).toBe('user2');
      expect(view.$('.privacy-status').hasClass('disabled')).toBeTruthy(); // You aren't the owner
      expect(view.$('.delete.tooltip').length).toBe(0);
    });

    it("should go to table view when click in the table item", function() {
      tables.reset([ generateTableData('table_name1', 'user2', 3) ]);
      var table_item = _.find(view._subviews, function(v) {
        return v instanceof cdb.admin.dashboard.TableItem
      });
      spyOn(table_item, '_onItemClick');
      table_item.delegateEvents();
      table_item.$('.table-item-inner').click();
      expect(table_item._onItemClick).toHaveBeenCalled();
    });

    it("should navigate to a tag route when a tag is clicked", function() {
      var called = false;
      var where = '';
      
      router.navigate = function(route, opts) {
        called = true;
        where = route;
      };
      
      tables.reset([ generateTableData('table_name1', 'test') ]);
      view.$('.table-tags a:eq(0)').click();
      expect(view.$('.table-tags a:eq(0)').attr('href')).toBe('/dashboard/tables/tag/tag6');
      expect(called).toBeTruthy();
      expect(where).toBe('tables/tag/tag6');

      called = false;
      where = '';

      cdb.config.set('url_prefix', '/u/test');
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;

      tables.reset([ generateTableData('table_name1', 'test') ]);
      view.$('.table-tags a:eq(0)').click();
      expect(called).toBeTruthy();
      expect(view.$('.table-tags a:eq(0)').attr('href')).toBe('/u/test/dashboard/tables/tag/tag6');
      expect(where).toBe('tables/tag/tag6');
    });

    it("should show sync status when it is a synchronizable table", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;
      tables.reset([ generateTableData('table_name1', 'test') ]);
      expect(view.$('.table-item-inner').hasClass('shared')).toBeTruthy();
    });

    it("should open privacy dialog when click over the privacy icon", function() {
      tables.reset([ generateTableData('table_name1', 'test') ]);
      view.$('.table-title a i.privacy-status').click();
      var table_item = _.find(view._subviews, function() { return true });
      expect(table_item.privacy_dialog).toBeDefined();
      table_item.privacy_dialog.clean();
    });

    it("should change privacy status when changes in model", function() {
      tables.reset([ generateTableData('table_name1', 'test') ]);
      var table_model = tables.at(0);
      expect(view.$('.table-title i.privacy-status').hasClass('public')).toBeTruthy();
      table_model.set('privacy', 'PRIVATE');
      expect(view.$('.table-title i.privacy-status').hasClass('private')).toBeTruthy();
      expect(view.$('.table-title i.privacy-status').hasClass('public')).toBeFalsy();
    });

    it("should apply a 'shared' class when visualization has shared properties", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;
      tables.reset([ generateTableData('table_name1', 'test') ]);
      expect(view.$('.table-item-inner').hasClass('shared')).toBeTruthy()
    });

    it("should render again with order changed when sort value changes", function() {
      tables.options.set("order", "updated_at")
      tables.reset([ generateTableData('table_name1', 'test') ]);
      expect(view.$('.table-order span').text().search('Update')).not.toBe(-1)
    });

    it("should set table link with prefix when user belongs to a organization", function() {
      cdb.config.set('url_prefix', '/u/test');
      tables.reset([ generateTableData('table_name1', 'test') ]);
      expect(view.$('h3 a').attr('href')).toBe('/u/test/tables/untitled_table_9');
    });

    it("should set shared-users count when table is shared", function() {
      tables.reset([ generateTableData('table_name1', 'test') ]);
      var table_model = tables.at(0);
      var table_item = _.find(view._subviews, function() { return true });
      table_model.permission.acl.reset([{ type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url : '' }, access: 'r' }])
      expect(view.$('.table-title a i.privacy-status span.shared_users').text()).toBe('1');
      table_model.permission.acl.reset([]);
      table_item = _.find(view._subviews, function() { return true });
      expect(table_item.$('.table-title a i.privacy-status span.shared_users').length).toBe(0);
    });

    it("should set 'ORG' text in shared-users when permission is for the whole organization", function() {
      tables.reset([ generateTableData('table_name1', 'test') ]);
      var table_model = tables.at(0);
      var table_item = _.find(view._subviews, function() { return true });
      table_model.permission.acl.reset([{ type: 'org', entity: { id: 'uuid', username: 'u1', avatar_url : '' }, access: 'r' }])
      expect(view.$('.table-title a i.privacy-status span.shared_users').text()).toBe('ORG');
    });

  });



  // Utils
  function generateTableData(table_name, user_name, user_id) {
    return {
      map_id:           96,
      active_layer_id:  null,
      name:             table_name || "test_vis",
      description:      "Visualization description",
      tags:             ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9"],
      privacy:          "PUBLIC",
      created_at:       "2013-03-04T18:09:34+01:00",
      updated_at:       "2013-03-04T18:09:34+01:00",
      locked:           false,
      table: { id: 396, name: "untitled_table_9", privacy: "PRIVATE", row_count: 0, size: 16384, updated_at: "2013-03-04T18:09:34+01:00" },
      type:             "table",
      permission: {
        owner: { username: user_name || 'test', avatar_url: 'http://test.com', id: ( user_id || 2 )},
        acl: []
      }
    }
  }

});
