var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var DataviewsCollection = require('../../../src/dataviews/dataviews-collection');

describe('src/dataviews/dataviews-collection', function () {
  beforeEach(function () {
    this.dataviewsFetched = jasmine.createSpy('dataviewsFetched');

    this.vis = new VisModel();
    this.vis.on('dataviewsFetched', this.dataviewsFetched, this);
    spyOn(this.vis, 'reload');

    this.dataviewsCollection = new DataviewsCollection([], {
      vis: this.vis
    });

    spyOn(this.dataviewsCollection, '_check').and.callThrough();

    this.dataviewsCollection.track();
  });

  it('should be tracking when tracking', function () {
    expect(this.dataviewsCollection._tracking).toBe(true);
  });

  it('should check fetchStatus when any dataviews changes', function () {
    var dataview1 = new Backbone.Model();
    this.dataviewsCollection.add(dataview1);

    var dataview2 = new Backbone.Model();
    this.dataviewsCollection.add(dataview2);

    dataview1.set('fetchStatus', 'fetching');
    expect(this.dataviewsCollection._check).toHaveBeenCalled();
  });

  it('should trigger dataviewsFetched event when all dataviews fetches', function () {
    var dataview1 = new Backbone.Model();
    this.dataviewsCollection.add(dataview1);

    var dataview2 = new Backbone.Model();
    this.dataviewsCollection.add(dataview2);

    dataview1.set('fetchStatus', 'fetched');
    dataview2.set('fetchStatus', 'fetched');

    expect(this.dataviewsFetched).toHaveBeenCalled();
  });

  it('should not trigger dataviewsFetched event if not tracking', function () {
    this.dataviewsFetched.calls.reset();
    this.dataviewsCollection._tracking = false;

    var dataview1 = new Backbone.Model();
    this.dataviewsCollection.add(dataview1);

    var dataview2 = new Backbone.Model();
    this.dataviewsCollection.add(dataview2);

    dataview1.set('fetchStatus', 'fetched');
    dataview2.set('fetchStatus', 'fetched');

    expect(this.dataviewsFetched).not.toHaveBeenCalled();
  });
});
