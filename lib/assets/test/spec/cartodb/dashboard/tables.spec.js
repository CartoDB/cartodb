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

  it("should show loader if a router parameter has changed, but not model", function() {
    spyOn(view, '_showLoader');
    spyOn(view, '_hideLoader');

    router.model.set('tag', 'jam');
    expect(view._showLoader).toHaveBeenCalled();

    router.model.set('model', 'visualizations');
    expect(view._hideLoader).toHaveBeenCalled();
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

    it("", function() {

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
