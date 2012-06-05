
describe("core.view", function() {

  var TestView = cdb.core.View.extend({
    initialize: function() {
      this.init_called = true;
    },
    test_method: function() {}
  });

  var view;

  beforeEach(function() {
      cdb.core.View.viewCount = 0;
      view = new TestView({ el: $('<div>')});

  });

  it("should call initialize", function() {
      expect(view.init_called).toEqual(true);
  });

  it("should increment refCount", function() {
      expect(cdb.core.View.viewCount).toEqual(1);
      expect(cdb.core.View.views[view.cid]).toBeTruthy();
  });


  it("should decrement refCount", function() {
      view.clean();
      expect(cdb.core.View.viewCount).toEqual(0);
      expect(cdb.core.View.views[view.cid]).toBeFalsy();
  });

  it("clean should remove view from dom", function() {
      var dom = $('<div>');
      dom.append(view.el);
      expect(dom.children().length).toEqual(1);
      view.clean();
      expect(dom.children().length).toEqual(0);
  });

  it("clean should unbind all events", function() {
      var model = new Backbone.Model();
      view.bind('meh', function(){});
      expect(_.size(view._callbacks)).toEqual(1);
      view.clean();
      expect(model._callbacks).toEqual(undefined);
  });

});
