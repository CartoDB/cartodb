describe("cdb.admin.DeleteDialog", function() {
  var dialog, table, vis, vis2;
  var headerTitle, contentText, contentText2, okButtonText;

  afterEach(function() {
    dialog.clean();
  });

  beforeEach(function() {

    table = TestUtil.createTable('test');

    vis = new cdb.admin.Visualization();
    vis.save({ name: "fake", tables: "test" });

    vis2 = new cdb.admin.Visualization();
    vis2.save({ name: "fake_2", tables: "test" });

    table.set("affected_visualizations", [vis, vis2]);

    headerTitle  = 'Delete this table';
    contentText  = 'Your are about to delete this table. Please note that if you do it, you will not be able to recover this information.';
    contentText2 = 'Your are about to delete this table. Please note that if you do it, you will not be able to recover this information and you will possibly break the visualizations below.';
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

  xit("should alert the user when deleting the table will destroy the visualizations", function() {
    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .content p").text()).toEqual(contentText2);
  });

});
