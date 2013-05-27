
describe("Delete table dialog", function() {
  var dialog, table;
  var headerTitle, contentText, okButtonText;

  afterEach(function() {
    dialog.clean();
  });

  beforeEach(function() {

    table = TestUtil.createTable('test');

    headerTitle  =  "Delete this table";
    contentText  =  "You are about to delete this table. Doing so will result in the deletion of this dataset. We recommend you export it before deleting it.";
    okButtonText = "Delete this table";

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

  it("should render the content", function() {
    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .content p").text()).toEqual(contentText);
  });

  it("should render the ok button text", function() {
    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .foot .ok.button").text()).toEqual(okButtonText);
  });

  it("should render an export link", function() {
    $("body").append(dialog.render().el);
    expect(dialog.$el.find(".confirmation .foot .export").text()).toEqual("Export");
  });

});
