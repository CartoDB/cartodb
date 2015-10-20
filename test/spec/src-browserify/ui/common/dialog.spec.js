
describe("common.ui.Dialog", function() {

  var dialog;
  beforeEach(function() {
    dialog = new cdb.ui.common.Dialog({el: $('<div>')});
    dialog.ok = function() {};
    dialog.cancel = function() {};
    spyOn(dialog, 'ok');
    spyOn(dialog, 'cancel');
  });

  it("should show element on open", function() {
    dialog.open();
    expect(dialog.$el.css('display')).toEqual('block');
  });

  it("should hide element on close", function() {
    dialog.open();
    dialog.hide();
    expect(dialog.$el.css('display')).toEqual('none');
  });

  it("should hide element on ok", function() {
    dialog.open();
    dialog._ok();
    expect(dialog.$el.css('display')).toEqual('none');
  });

  it("should call cancel on _cancel", function() {
    dialog._ok();
    expect(dialog.ok).toHaveBeenCalled();
  });

  it("should call ok on _ok", function() {
    dialog._cancel();
    expect(dialog.cancel).toHaveBeenCalled();
  });

  it("should append it to body and be rendered", function() {
    var s = sinon.stub(dialog, 'render');
    s.returns(dialog);
    var r = dialog.appendToBody();
    expect(s.called).toEqual(true);
    expect(dialog.$el.parent()[0]).toEqual(document.body);
    expect(r).toEqual(dialog);
  });

  it("should render title", function() {
      var dialog = new cdb.ui.common.Dialog({
        title: 'test',
        template_base: '<%= title %>'
      });
      expect(dialog.render().$el.html()).toEqual('test');
  });

});
