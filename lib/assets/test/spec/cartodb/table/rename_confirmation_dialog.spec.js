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

  it("should rename the table", function() {
    spyOn(model, 'save');
    view.ok();
    expect(model.save).toHaveBeenCalled();
    expect(model.get('name')).toEqual('test2');

  });
});
