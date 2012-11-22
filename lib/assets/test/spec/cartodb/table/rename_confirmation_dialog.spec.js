describe("RenameConfirmationDialog", function() {

  var model, view;
  beforeEach(function() {
    model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
    });
    view = new cdb.admin.RenameConfirmationDialog({
      model: model,
      newName: 'test2'
    });

  });

  it("should render", function() {
    view.render();
  });

  it("should trigger the table renaming", function() {
    var called = false;
    var promise = view.confirm();
    $.when(promise).done(function() {
      called = true;
    });
    view.ok();
    expect(called).toBeTruthy();
  });
});
