var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var View = require('../../../src/core/view');

describe('core/view', function () {
  var TestView;
  var view;

  beforeEach(function () {
    TestView = View.extend({
      initialize: function () {
        this.init_called = true;
      },
      test_method: function () {}
    });

    View.viewCount = 0;
    view = new TestView({
      el: $('<div>')
    });
  });

  it('should call initialize', function () {
    expect(view.init_called).toEqual(true);
  });

  it('should increment refCount', function () {
    expect(View.viewCount).toEqual(1);
    expect(View.views[view.cid]).toBeTruthy();
  });

  it('should decrement refCount', function () {
    view.clean();
    expect(View.viewCount).toEqual(0);
    expect(View.views[view.cid]).toBeFalsy();
  });

  it('clean should remove view from dom', function () {
    var dom = $('<div>');
    dom.append(view.el);
    expect(dom.children().length).toEqual(1);
    view.clean();
    expect(dom.children().length).toEqual(0);
  });

  it('clean should unbind all events', function () {
    view.bind('meh', function () {});
    expect(_.size(view._events)).toEqual(1);
    view.clean();
    expect(view._events).toEqual(undefined);
  });

  it('should unlink the view model', function () {
    var called = false;
    var newView = new TestView({ el: $('<div>'), model: new Backbone.Model() });

    spyOn(newView, 'test_method');
    newView.model.bind('change', newView.test_method, newView);
    newView.model.bind('change', function () { called = true; });

    newView.model.trigger('change');
    expect(called).toEqual(true);
    expect(newView.test_method).toHaveBeenCalled();
    expect(newView.test_method.calls.count()).toEqual(1);
    called = false;
    newView.clean();
    // trigger again
    newView.model.trigger('change');
    expect(called).toEqual(true);
    expect(newView.test_method.calls.count()).toEqual(1);
  });

  it('should unlink linked models', function () {
    var called = false;
    var model = new Backbone.Model();
    spyOn(view, 'test_method');
    model.bind('change', view.test_method, view);
    model.bind('change', function () { called = true; });
    view.add_related_model(model);

    model.trigger('change');
    expect(called).toEqual(true);
    expect(view.test_method).toHaveBeenCalled();
    expect(view.test_method.calls.count()).toEqual(1);
    called = false;
    view.clean();
    expect(_.size(view._models)).toEqual(0);
    // trigger again
    model.trigger('change');
    expect(called).toEqual(true);
    expect(view.test_method.calls.count()).toEqual(1);
  });

  it('should add and remove subview', function () {
    var v1 = new View();
    view.addView(v1);
    expect(view._subviews[v1.cid]).toEqual(v1);
    expect(v1._parent).toEqual(view);
    view.removeView(v1);
    expect(view._subviews[v1.cid]).toEqual(undefined);
  });

  it('should remove and clean subviews', function () {
    var v1 = new View();
    spyOn(v1, 'clean');
    view.addView(v1);
    expect(view._subviews[v1.cid]).toEqual(v1);
    view.clean();
    expect(view._subviews[v1.cid]).toEqual(undefined);
    expect(v1.clean).toHaveBeenCalled();
  });

  it('subview shuould be removed from its parent', function () {
    var v1 = new View();
    view.addView(v1);
    expect(view._subviews[v1.cid]).toEqual(v1);
    v1.clean();
    expect(view._subviews[v1.cid]).toEqual(undefined);
  });

  it('extendEvents should extend events', function () {
    var V1 = View.extend({
      events: View.extendEvents({
        'click': 'hide'
      })
    });
    var v1 = new V1();
    expect(v1.el.style.display).not.toEqual('none');
    v1.$el.trigger('click');
    expect(v1.el.style.display).toEqual('none');
  });

  it('should retrigger an event when launched on a descendant object', function (done) {
    var launched = false;
    view.child = new TestView({});
    view.retrigger('cachopo', view.child);
    view.bind('cachopo', function () {
      launched = true;
    });
    view.child.trigger('cachopo');
    setTimeout(function () {
      expect(launched).toBeTruthy();
      done();
    }, 25);
  });

  it('should kill an event', function () {
    var ev = {
      stopPropagation: function () {},
      preventDefault: function () {}
    };
    var ev2 = 'thisisnotanevent';

    spyOn(ev, 'stopPropagation');
    spyOn(ev, 'preventDefault');

    view.killEvent(ev);
    view.killEvent(ev2);
    view.killEvent();

    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(ev.preventDefault).toHaveBeenCalled();
  });
});
