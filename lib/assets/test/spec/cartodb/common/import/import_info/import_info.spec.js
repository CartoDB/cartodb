describe("ImportInfo", function() {

  var view, model;

  beforeEach(function() {
    model = new cdb.admin.ImportPaneModel();
    view = new cdb.admin.ImportInfo({ model:model, acceptSync:true });
  });

  it("should create components properly", function() {
    expect(view.panes.size()).toBe(3);
  });

  it("should show sync pane if value attribute changes and is valid", function() {
    view.model.set('value', 'http://jam.co')
    expect(view.panes.activeTab).toBe("sync");
  });

  it("shouldn't show sync pane if user is not allowed", function() {
    view.options.acceptSync = false;
    view.model.set('value', 'http://jam.co')
    expect(view.panes.activeTab).toBe("sync_disabled");
  });

  it("should hide sync pane if the value is not valid", function() {
    spyOn(view, '_hideTab');
    view.model.set('value', 'http://jam.co')
    expect(view.panes.activeTab).toBe("sync");
    view.model.set('value', 'http:/');
    expect(view.panes.activeTab).toBe("sync");
    expect(view._hideTab).toHaveBeenCalled();
  });

});