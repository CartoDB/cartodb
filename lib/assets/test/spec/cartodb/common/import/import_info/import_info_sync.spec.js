describe("ImportInfoSync", function() {

  var view;

  beforeEach(function() {
    view = new cdb.admin.ImportInfo.Sync();
  });

  it("should generate period combo", function() {
    expect(_.size(view._subviews)).toBe(1);
    expect(view.$('.period')).toBeDefined();
  });

  it("should change period if combo changes", function() {
    var called = false;
    view.bind('periodChange', function() {
      called = true;
    })
    view.$("select").val(["Every day", (60*60*24)]).trigger("change");
    expect(called).toBeTruthy()
  });

});