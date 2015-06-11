describe("ImportInfo", function() {

  var view, model;

  beforeEach(function() {
    model = new cdb.admin.ImportPaneModel();
    view = new cdb.admin.ImportInfo({ model:model, acceptSync:true });
  });

  it("should create components properly", function() {
    expect(view.panes.size()).toBe(5);
  });

  it("should show sync pane if value attribute changes and is valid", function() {
    view.model.set('value', 'http://jam.co')
    expect(view.panes.activeTab).toBe("sync");
  });

  it("should show zip info if value is valid and not a compressed file", function() {
    var view2 = new cdb.admin.ImportInfo({ model:model, acceptSync:false, fileTypes: ['csv'] });
    view2.model.set('value', 'http://test.csv')
    expect(view2.panes.activeTab).toBe("zip");
  });

  it("should show xls info if value is valid and an Excel file", function() {
    var view2 = new cdb.admin.ImportInfo({ model:model, acceptSync:false, fileTypes: ['xls'] });
    view2.model.set('value', 'http://test.xls')
    expect(view2.panes.activeTab).toBe("xls");
  });

  it("shouldn't show sync pane if user is not allowed", function() {
    view.options.acceptSync = false;
    view.model.set('value', 'http://test.co')
    expect(view.panes.activeTab).toBe("sync_disabled");
  });

  it("should hide sync pane if the value is not valid", function() {
    spyOn(view, '_hideTab');
    view.model.set('value', 'http://test.co')
    expect(view.panes.activeTab).toBe("sync");
    view.model.set('value', 'http:/');
    expect(view.panes.activeTab).toBe("sync");
    expect(view._hideTab).toHaveBeenCalled();
  });

});