var DataviewsCollection = require('../../../src/dataviews/dataviews-collection');
var DataviewModel = require('../../../src/dataviews/dataview-model-base');
var whenAllDataviewsFetched = require('../../../src/vis/dataviews-tracker');
var MockFactory = require('../../helpers/mockFactory');

describe('src/vis/dataviews-tracker', function () {
  var options = {
    map: {},
    engine: {}
  };

  beforeEach(function () {
    this.dataviewsFetched = jasmine.createSpy('dataviewsFetched');

    this.source = MockFactory.createAnalysisModel({ id: 'a1' });

    this.onDataviewsfetched = jasmine.createSpy('onDataviewsfetched');

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
