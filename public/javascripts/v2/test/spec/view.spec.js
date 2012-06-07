
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
      view.bind('meh', function(){});
      expect(_.size(view._callbacks)).toEqual(1);
      view.clean();
      expect(view._callbacks).toEqual(undefined);
  });

  it("should unlink linked models", function() {
      var called = false;
      var model = new Backbone.Model();
      model.bind('change', view.test_method, this);
      model.bind('change', function() { called= true;});
      view.add_related_model(model);
      expect(model._callbacks.change.tail).not.toEqual(model._callbacks.change.next);

      model.trigger('change');
      expect(called).toEqual(true);
      called = false;
      view.clean();
      model.trigger('change');
      expect(called).toEqual(true);
      // there is only one event
      expect(model._callbacks.change.tail).toEqual(model._callbacks.change.next);
  });

});
