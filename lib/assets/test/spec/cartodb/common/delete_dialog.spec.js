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
    vis.save({ id: 1, name: "fake", tables: "test" });

    vis2 = new cdb.admin.Visualization();
    vis2.save({ id: 2, name: "fake_2", tables: "test" });

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
      content: contentText
    });

  });

  it("should render the title", function() {
    $("body").append(dialog.render().el);
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

    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .content p").text()).toEqual(contentText);
  });

  it("should render the ok button text", function() {
    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .foot .ok.button").text()).toEqual(okButtonText);
  });

  it("should render an export link", function() {
    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .foot .export").text()).toEqual("Export my data first");
  });

});
