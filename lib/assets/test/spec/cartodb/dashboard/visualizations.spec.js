describe("Dashboard visualizations view", function() {

  var view, visualizations, router, user, importer;

  beforeEach(function() {
    var $el = $('<div>');
    visualizations = new cdb.admin.Visualizations({ type: 'derived' });
    router = new cdb.admin.dashboard.DashboardRouter();

    router.model.set('model', 'visualizations', { silent: true });

    user = TestUtil.createUser('test');
    importer = new cdb.ui.common.BackgroundImporter({ template_base: '' });

    // Setup all necessary table views
    view = new cdb.admin.dashboard.Visualizations({
      el:             $el,
      visualizations: visualizations,
      user:           user,
      router:         router,
      config:         {},
      importer:       importer
    });

  });

  it("should render properly", function() {
    expect(view.$('#vislist').length).toBe(1);
    expect(view.$('aside').length).toBe(1);
    expect(view.$('.paginator').length).toBe(1);
    expect(view.$('aside ul li').length).toBe(3);
  });

  it("should show create-vis-dialog", function() {
    expect(view.create_dialog).not.toBeDefined();
    view.$("aside .create").click();
    expect(view.create_dialog).toBeDefined();
    view.create_dialog.clean();
  });

  it("should append 'empty items' when a row is not completed", function() {
    visualizations.reset([ generateVisData('vis_name_1', 'test') ]);
    expect(view.$el.find('.vis-item.empty').length).toBe(2);
    visualizations.reset([ generateVisData('vis_name_1', 'test'), generateVisData('vis_name_2', 'test') ]);
    expect(view.$el.find('.vis-item.empty').length).toBe(1);
  });


  describe("Visualizations list", function() {

    var visualizations, router, $el, user, view;

    beforeEach(function() {
      $el = $('<div>');
      visualizations = new cdb.admin.Visualizations({ type: 'derived' });
      router = new cdb.admin.dashboard.DashboardRouter();
      user = TestUtil.createUser('test');

      // Tables list
      view = new cdb.admin.dashboard.VisualizationsList({
        el:         $el,
        collection: visualizations,
        router:     router,
        user:       user
      });
    });

    it("should render properly the visualization items", function() {
      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      expect(view.$('h3 a').text()).toBe('vis_name1');
      expect(view.$('.privacy-status').hasClass('public')).toBeTruthy();
      expect(view.$('.privacy-status span.shared_users').length).toBe(0);
      expect(view.$('a i.lock').length).toBe(1);
      expect(view.$('.vis-shared').length).toBe(0);
      expect(view.$('.vis-tags a').length).toBe(3);
      expect(view.$('.vis-tools .order').text().search('Updated')).not.toBe(-1)
      expect(view.$('.vis-description').text()).toBe('Visualization description');
    });

    it("should render a vis item with shared data, being owner", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;

      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      expect(view.$('.vis-shared').length).toBe(1);
      expect(view.$('.vis-tags a').length).toBe(0);
      expect(view.$('.vis-shared-tags .total-tags').text()).toBe('4 tags');
      expect(view.$('.vis-shared-info .username').text()).toBe('Created by You');
      expect(view.$('.vis-shared-info .avatar').attr('src')).toBe('http://test.com');
      expect(view.$('.privacy-status').hasClass('disabled')).toBeFalsy(); // You are the owner
      expect(view.$('.delete.tooltip').length).toBe(1); // You are the owner
    });

    it("should render a vis item with shared data, not being owner", function() {
      var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
      user.organization = org;

      visualizations.reset([ generateVisData('vis_name1', 'paco', 3) ]);
      expect(view.$('.vis-shared').length).toBe(1);
      expect(view.$('.vis-shared-info .username').text()).toBe('Created by paco');
      expect(view.$('.privacy-status').hasClass('disabled')).toBeTruthy(); // You aren' the owner
      expect(view.$('.delete.tooltip').length).toBe(0); // You aren' the owner
    });

    it("should go to visualization view when click in the vis item", function() {
      visualizations.reset([ generateVisData('vis_name1', 'paco', 3) ]);
      var vis_item = _.find(view._subviews, function(v) {
        return v instanceof cdb.admin.dashboard.VisualizationItem
      });
      spyOn(vis_item, '_onItemClick');
      vis_item.delegateEvents();
      vis_item.$('.vis-item').click();
      expect(vis_item._onItemClick).toHaveBeenCalled();
    });

    it("should navigate to a tag route when a tag is clicked", function() {
      var called = false;
      var where = '';
      
      router.navigate = function(route, opts) {
        called = true;
        where = route;
      };
      
      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      view.$('.vis-tags a:eq(0)').click();
      expect(view.$('.vis-tags a:eq(0)').attr('href')).toBe('/dashboard/visualizations/tag/tag1');
      expect(called).toBeTruthy();
      expect(where).toBe('visualizations/tag/tag1');
    });

    it("should open privacy dialog when click over the privacy icon", function() {
      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      var vis = visualizations.at(0)
      spyOn(vis, 'getRelatedTables').and.callFake(function(o) {
        o.success();
      });
     
      view.$('.vis-buttons a i.privacy-status').click();
      var vis_item = _.find(view._subviews, function() { return true });
      expect(vis_item.privacy_dialog).toBeDefined();
      vis_item.privacy_dialog.clean();
    });

    it("should change privacy status when changes in model", function() {
      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      var vis_model = visualizations.at(0);
      expect(view.$('i.privacy-status').hasClass('public')).toBeTruthy();
      vis_model.set('privacy', 'PRIVATE');
      expect(view.$('i.privacy-status').hasClass('private')).toBeTruthy();
    });

    it("should render again with order changed when sort value changes", function() {
      visualizations.options.set("order", "updated_at")
      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      expect(view.$('.vis-tools .order').text().search('Update')).not.toBe(-1);

      visualizations.options.set("order", "created_at")
      visualizations.reset([ generateVisData('vis_name2', 'test') ]);
      expect(view.$('.vis-tools .order').text().search('Create')).not.toBe(-1)
    });

    it("should set table link with prefix when user belongs to a organization", function() {
      user.organization = new cdb.admin.Organization({ id:1, users: [1,2,3,4] });
      cdb.config.set('url_prefix', '/u/test');
      visualizations.reset([ generateVisData('vis_name1', 'test') ]);
      expect(view.$('h3 a').attr('href')).toBe('/u/test/viz/vis_name1-asdf/map');
    });

    it("should set table link with owner prefix when user belongs to a organization but visualization is not from the user", function() {
      cdb.config.set('url_prefix', '/u/test');
      visualizations.reset([ generateVisData('vis_name1', 'paco') ]);
      expect(view.$('h3 a').attr('href')).toBe('/u/paco/viz/vis_name1-asdf/map');
    });

    it("should set shared-users count when visualization is shared", function() {
      visualizations.reset([ generateVisData('vis_name2', 'test') ]);
      var vis_model = visualizations.at(0);
      var vis_item = _.find(view._subviews, function() { return true });
      vis_model.permission.acl.reset([{ type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url : '' }, access: 'r' }])
      expect(vis_item.$('a i.privacy-status span.shared_users').text()).toBe('1');
      vis_model.permission.acl.reset([]);
      vis_item = _.find(view._subviews, function() { return true });
      expect(vis_item.$('a i.privacy-status span.shared_users').length).toBe(0);
    });

    it("should set 'ORG' text in shared-users when permission is for the whole organization", function() {
      visualizations.reset([ generateVisData('vis_name2', 'test') ]);
      var vis_model = visualizations.at(0);
      var vis_item = _.find(view._subviews, function() { return true });
      vis_model.permission.acl.reset([{ type: 'org', entity: { id: 'uuid', username: 'u1', avatar_url : '' }, access: 'r' }])
      expect(view.$('a i.privacy-status span.shared_users').text()).toBe('ORG');
    });

    it("shouldn't show lock item when visualization owner is different", function() {
      visualizations.reset([ generateVisData('vis_name2', 'other', 69) ]);
      var vis_model = visualizations.at(0);
      var vis_item = _.find(view._subviews, function() { return true });
      expect(view.$('a i.lock').length).toBe(0);
    });

    it("should allow to like a visualization", function() {
      visualizations.reset([ generateVisData('vis_name1', 'paco', 3) ]);
      var vis_item = _.find(view._subviews, function(v) {
        return v instanceof cdb.admin.dashboard.VisualizationItem
      });
      spyOn(vis_item, '_onLikeClick');
      vis_item.delegateEvents();
      vis_item.$('.js-like').click();
      expect(vis_item._onLikeClick).toHaveBeenCalled();
    });
  });

  // Utils
  function generateVisData(table_name, user_name, user_id) {
    return {
      id:               table_name + '-asdf',
      map_id:           96,
      active_layer_id:  null,
      name:             table_name || "test_vis",
      description:      "Visualization description",
      tags:             ["tag1", "tag2", "tag3", "tag4"],
      likes:            0,
      liked:            false,
      privacy:          "PUBLIC",
      locked:           false,
      created_at:       "2013-03-04T18:09:34+01:00",
      updated_at:       "2013-03-04T18:09:34+01:00",
      stats:            [],
      table:            { id: 396, name: "untitled_table_9", privacy: "PRIVATE", row_count: 0, size: 16384, updated_at: "2013-03-04T18:09:34+01:00" },
      type:             "derived",
      permission: {
        owner:          { username: user_name || 'test', avatar_url: 'http://test.com', id: ( user_id || 2 )},
        acl:            []
      }
    }
  }

});
