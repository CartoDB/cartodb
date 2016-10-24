var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var DataviewsTracker = require('../../../src/vis/dataviews-tracker');

describe('src/vis/dataviews-tracker', function () {
  beforeEach(function () {
    this.dataviewsFetched = jasmine.createSpy('dataviewsFetched');

    this.vis = new VisModel();
    this.vis.on('dataviewsFetched', this.dataviewsFetched, this);
    spyOn(this.vis, 'reload');

    this.dataviewsTracker = new DataviewsTracker([], {
      vis: this.vis
    });

    spyOn(this.dataviewsTracker, '_check').and.callThrough();

    this.dataviewsTracker.track();
  });

  it('should be tracking when tracking', function () {
    expect(this.dataviewsTracker._tracking).toBe(true);
  });

  it('should patch dataviews when added', function () {
    var dataview = new Backbone.Model();
    this.dataviewsTracker.add(dataview);

    expect(dataview.__patched).toBe(true);
    expect(dataview.get('fetchStatus')).toBe('unfetched');
  });

  it('should patch dataviews when added', function () {
    var dataview = new Backbone.Model();
    this.dataviewsTracker.add(dataview);

    expect(dataview.__patched).toBe(true);
    expect(dataview.get('fetchStatus')).toBe('unfetched');
  });

  it('should check fetchStatus when any dataviews changes', function () {
    var dataview1 = new Backbone.Model();
    this.dataviewsTracker.add(dataview1);

    var dataview2 = new Backbone.Model();
    this.dataviewsTracker.add(dataview2);

    dataview1.set('fetchStatus', 'fetching');
    expect(this.dataviewsTracker._check).toHaveBeenCalled();
  });

  it('should trigger dataviewsFetched event when all dataviews fetches', function () {
    var dataview1 = new Backbone.Model();
    this.dataviewsTracker.add(dataview1);

    var dataview2 = new Backbone.Model();
    this.dataviewsTracker.add(dataview2);

    dataview1.set('fetchStatus', 'fetched');
    dataview2.set('fetchStatus', 'fetched');

    expect(this.dataviewsFetched).toHaveBeenCalled();
  });

  it('should not trigger dataviewsFetched event if not tracking', function () {
    this.dataviewsFetched.calls.reset();
    this.dataviewsTracker._tracking = false;

    var dataview1 = new Backbone.Model();
    this.dataviewsTracker.add(dataview1);

    var dataview2 = new Backbone.Model();
    this.dataviewsTracker.add(dataview2);

    dataview1.set('fetchStatus', 'fetched');
    dataview2.set('fetchStatus', 'fetched');

    expect(this.dataviewsFetched).not.toHaveBeenCalled();
  });
});
