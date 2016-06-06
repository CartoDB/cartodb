var cdb = require('cartodb.js');
var _ = require('underscore');

var NotifierView = require('../../../../../../javascripts/cartodb3/editor/components/notifier/notifier-view.js');
var NotifierCollection = require('../../../../../../javascripts/cartodb3/editor/components/notifier/notifier-collection.js');

describe('editor/components/notifier/notifier-view', function () {
  var view;
  var collection;
  var subview;

  beforeEach(function () {
    subview = new cdb.core.View();
    var anotherSubview = new cdb.core.View();

    collection = new NotifierCollection();
    view = new NotifierView({
      collection: collection,
      editorModel: new cdb.core.Model()
    });

    view.render();
    collection.add(subview);
    collection.add(anotherSubview);
  });

  it('should render properly', function () {
    expect(view.el).toBeDefined();
    expect(_.keys(view._subviews).length).toBe(2);
  });

  it('should add and remove subview properly', function () {
    var cid = subview.cid;
    expect(view._subviews[cid]).toBeDefined();
    expect(_.keys(view._subviews).length).toBe(2);

    collection.remove(subview);
    expect(view._subviews[cid]).not.toBeDefined();
    expect(_.keys(view._subviews).length).toBe(1);
  });

  it('should remove subview properly', function () {
    var foo = new cdb.core.View();

    collection.add(foo);
    expect(_.keys(view._subviews).length).toBe(3);
    collection.remove(foo);
    expect(_.keys(view._subviews).length).toBe(2);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
