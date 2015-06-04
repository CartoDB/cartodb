describe("cdb.admin.DeleteDialog", function() {
  var dialog, table, vis, vis2;
  var headerTitle, contentText, contentText2, okButtonText;

  afterEach(function() {
    dialog.clean();
  });

  beforeEach(function() {

    //config    = TestUtil.config;
    //user_data = TestUtil.user_data;

    table = TestUtil.createTable('test');
    table2 = TestUtil.createTable('test_2');

    vis = new cdb.admin.Visualization();
    vis.set({ id: 1, name: "fake", tables: "test" });

    vis2 = new cdb.admin.Visualization();
    vis2.set({ id: 2, name: "fake_2", tables: "test" });

    table.set("dependent_visualizations", [vis, vis2]);
    table.set("table_visualization", { id: 1 });

    headerTitle  = 'Delete this table';
    contentText  = 'You are about to delete this table. Doing so will result in the deletion of this dataset.';
    contentText2 = 'You are about to delete this table. Doing so will result in the deletion of this dataset. Also, deleting this layer will affect the following visualizations.';
    okButtonText = 'Delete this table';

    dialog = new cdb.admin.DeleteDialog({
      model: table,
      title: headerTitle,
      ok_title: okButtonText,
      content: contentText,
      enter_to_confirm: false
    });

  });

  it("should render the title", function() {
    dialog.render();
    expect(dialog.$el.find(".confirmation .head h3").text()).toEqual(headerTitle);
  });

  it("should show a loader by default", function() {
    dialog.render().open();
    expect(dialog.$el.find(".loader").hasClass("hidden")).toBeFalsy();
  });

  it("should render the content", function() {

    table = TestUtil.createTable('test');
    table.set("dependent_visualizations", [vis, vis2]);
    table.set("table_visualization", { id: 1 });

    dialog = new cdb.admin.DeleteDialog({
      model: table,
      title: headerTitle,
      ok_title: okButtonText,
      content: contentText
    });

    dialog.render();
    expect(dialog.$el.find(".confirmation .content p").text()).toEqual(contentText);
  });

  it("should show dependent visualizations owner if user comes from an organization", function(done) {
    var user = TestUtil.createUser('test');
    user.organization = new cdb.admin.Organization({ id:1, users:[1,2,3] });

    var table_1 = TestUtil.createTable('test');

    var vis3 = new cdb.admin.Visualization({
      id:               4,
      map_id:           96,
      active_layer_id:  null,
      name:             "test_vis jar",
      description:      "Visualization description",
      tags:             ["tag1", "tag2", "tag3", "tag4"],
      privacy:          "PUBLIC",
      type:             "derived",
      permission: {
        owner:  { username: 'jar', avatar_url: 'http://test.com', id: 4 },
        acl:    []
      }
    });

    table_1.set({
      dependent_visualizations: [ vis3.toJSON() ],
      table_visualization:      { id: 1 }
    });

    // Mock fadeIn/Out to remove timeout issues
    var originalfadeIn = $.prototype.fadeIn;
    var originalfadeOut = $.prototype.fadeOut;
    spyOn($.prototype, 'fadeIn').and.callFake(function(ms, callback) {
      if (callback) callback();
      originalfadeIn.apply(this, arguments);
    });
    spyOn($.prototype, 'fadeOut').and.callFake(function(ms, callback) {
      if (callback) callback();
      originalfadeOut.apply(this, arguments);
    });

    table_1.fetch = function(o) {
      // Success! forcing to show visualizations
      o.success();

      // Assert side-effects:
      expect(view.$('.visualizations').length).toBe(1);
      expect(view.$('.visualizations a:eq(0)').text()).toBe('test_vis jar (Created by jar)');
      view.clean();
      done();
    }.bind(this);

    var view = new cdb.admin.DeleteDialog({
      model: table_1,
      title: headerTitle,
      ok_title: okButtonText,
      content: contentText,
      user: user
    });

    view.render();
  });

  it("shouldn't show dependent visualizations owner if user doesn't belong to a org", function(done) {
    var user = TestUtil.createUser('test');

    table = TestUtil.createTable('test');
    table.set("dependent_visualizations", [vis.toJSON(), vis2.toJSON()]);
    table.set("table_visualization", { id: 1 });

    // Mock fadeIn/Out to remove timeout issues
    var originalfadeIn = $.prototype.fadeIn;
    var originalfadeOut = $.prototype.fadeOut;
    spyOn($.prototype, 'fadeIn').and.callFake(function(ms, callback) {
      if (callback) callback();
      originalfadeIn.apply(this, arguments);
    });
    spyOn($.prototype, 'fadeOut').and.callFake(function(ms, callback) {
      if (callback) callback();
      originalfadeOut.apply(this, arguments);
    });

    // Success! forcing to show visualizations
    table.fetch = function(o) {
      o.success();

      expect(view.$('.visualizations').length).toBe(1);
      expect(view.$('.visualizations a:eq(0)').text()).toBe('fake_2');
      view.clean();
      done();
    };

    var view = new cdb.admin.DeleteDialog({
      model: table,
      title: headerTitle,
      ok_title: okButtonText,
      content: contentText,
      user: user
    });

    view.render();
  });

  it("should render the ok button text", function() {
    dialog.render();
    expect(dialog.$el.find(".confirmation .foot .ok.button").text()).toEqual(okButtonText);
  });

  it("should render an export link", function() {
    dialog.render();
    expect(dialog.$el.find(".confirmation .foot .export").text()).toEqual("Export my data first");
  });

});
