var VisModel = require('../../../src/vis/vis');
var DataviewsCollection = require('../../../src/dataviews/dataviews-collection');
var DataviewModel = require('../../../src/dataviews/dataview-model-base');
var whenAllDataviewsFetched = require('../../../src/vis/dataviews-tracker');
var fakeFactory = require('../../helpers/fakeFactory');

describe('src/vis/dataviews-tracker', function () {
  var options = {
    map: {},
    vis: {}
  };

  beforeEach(function () {
    this.dataviewsFetched = jasmine.createSpy('dataviewsFetched');

    this.vis = new VisModel();
    spyOn(this.vis, 'reload');

    this.source = fakeFactory.createAnalysisModel({ id: 'a1' });

    this.onDataviewsfetched = jasmine.createSpy('onDataviewsfetched');
    spyOn(DataviewModel.prototype, '_initBinds');
    spyOn(DataviewModel.prototype, '_setupAnalysisStatusEvents');

    this.dataviewsCollection = new DataviewsCollection([]);

    whenAllDataviewsFetched(this.dataviewsCollection, this.onDataviewsfetched);
  });

  it('should check fetchStatus when any dataviews changes', function () {
    var dataview1 = new DataviewModel({
      source: this.source
    }, options);
    this.dataviewsCollection.add(dataview1);

    var dataview2 = new DataviewModel({
      source: this.source
    }, options);
    this.dataviewsCollection.add(dataview2);

    this.onDataviewsfetched.calls.reset();

    dataview1.set('status', 'fetched');
    expect(this.onDataviewsfetched).not.toHaveBeenCalled();
  });

  it('should trigger dataviewsFetched event when all dataviews fetches', function () {
    var dataview1 = new DataviewModel({
      source: this.source
    }, options);
    this.dataviewsCollection.add(dataview1);

    var dataview2 = new DataviewModel({
      source: this.source
    }, options);
    this.dataviewsCollection.add(dataview2);

    this.onDataviewsfetched.calls.reset();

    dataview1.set('status', 'fetched');
    dataview2.set('status', 'fetched');

    expect(this.onDataviewsfetched).toHaveBeenCalled();
  });
});
