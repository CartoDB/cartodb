var cdb = require('cartodb.js');
var NotifierCollection = require('../../../../../../javascripts/cartodb3/editor/components/notifier/notifier-collection.js');

describe('editor/components/notifier/notifier-collection', function () {
  beforeEach(function () {
    this.collection = new NotifierCollection();
  });

  it('should add view properly', function () {
    var view = new cdb.core.View();
    this.collection.add(view);

    var model = this.collection.first();
    expect(model.get('cid')).toBe(view.cid);
  });

  it('should search view properly', function () {
    var view = new cdb.core.View();
    var cid = view.cid;
    this.collection.add(view);
    expect(this.collection.search(cid).get('view')).toBe(view);
  });

  it('should remove view properly', function () {
    var view = new cdb.core.View();
    this.collection.add(view);

    var model = this.collection.remove(view);

    expect(model.get('cid')).toBe(view.cid);
    expect(this.collection.length).toBe(0);
  });
});
