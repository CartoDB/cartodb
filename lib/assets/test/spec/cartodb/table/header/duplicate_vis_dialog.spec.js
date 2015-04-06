
describe("Duplicate vis", function() {
  var duplicate_dialog, vis;
  beforeEach(function() {
    vis = TestUtil.createVis('vis_example');
    duplicate_dialog = new cdb.admin.DuplicateVisDialog({ model: vis });
  });

  it("should open the duplicate rename dialog", function() {
    duplicate_dialog.render();
    expect(duplicate_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Name for your copy of this map');
    expect(duplicate_dialog.$el.find(".modal").size()).toEqual(3);
    expect(duplicate_dialog.$el.find(".modal.creation").size()).toEqual(1);
    expect(duplicate_dialog.$el.find(".modal.error").size()).toEqual(1);
    expect(duplicate_dialog.$el.find(".modal.duplicating").size()).toEqual(1);
  });

  it("should show an error if the name of the new table is empty or same as actual visualization", function() {
    duplicate_dialog.render();
    spyOn(duplicate_dialog, '_changeState');
    duplicate_dialog.$el.find(".modal:eq(0) input.text").val("");
    duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();
    expect(duplicate_dialog._changeState).not.toHaveBeenCalled();
  });

  it("should change state if the new visualization name is ok", function() {
    duplicate_dialog.render();
    spyOn(duplicate_dialog, '_changeState');
    var server = sinon.fakeServer.create();
    duplicate_dialog.$el.find(".modal:eq(0) input.text").val("new vis name");
    duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();
    server.respondWith(200, {}, "");
    expect(duplicate_dialog._changeState).toHaveBeenCalled();
  });

  it("should change state if duplication fails", function() {
      // duplicate_dialog.render();
      // spyOn(duplicate_dialog, '_showError');
      
      // var server = sinon.fakeServer.create();

      // duplicate_dialog.$el.find(".modal:eq(0) input.text").val("example");
      // duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();

      // server.respondWith(500, {}, "{'response': false }");

      // expect(duplicate_dialog._showError).toHaveBeenCalled();
  });
});
