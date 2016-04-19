var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisModel = require('../../../src/analysis/analysis-model');
var AnalysisPoller = require('../../../src/analysis/analysis-poller');

describe('src/analysis/analysis-poller', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.map = jasmine.createSpyObj('map', ['something']);
    this.reference = jasmine.createSpyObj('reference', ['getParamNamesForAnalysisType']);
    this.analysisModel1 = new AnalysisModel({ id: 'a1' }, { map: this.map, camshaftReference: this.reference });
    this.analysisModel2 = new AnalysisModel({ id: 'a2' }, { map: this.map, camshaftReference: this.reference });
    this.analysisCollection = new Backbone.Collection([ this.analysisModel1, this.analysisModel2 ]);

    AnalysisPoller.poll(this.analysisCollection);
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  _.each([AnalysisModel.STATUS.PENDING, AnalysisModel.STATUS.WAITING, AnalysisModel.STATUS.RUNNING], function (newStatus) {
    it('should start polling if status of an analysis changes to "' + newStatus + '"', function () {
      spyOn(this.analysisModel1, 'fetch').and.callFake(function (options) {
        options.success();
      });

      this.analysisModel1.set({
        'status': newStatus
      });

      expect(this.analysisModel1.fetch).toHaveBeenCalled();
      expect(this.analysisModel1.fetch.calls.count()).toEqual(1);

      jasmine.clock().tick(1001);

      expect(this.analysisModel1.fetch.calls.count()).toEqual(2);
    });
  });

  _.each([AnalysisModel.STATUS.READY, AnalysisModel.STATUS.FAILED], function (newStatus) {
    it('should stop polling if status of an analysis changes to "' + newStatus + '"', function () {
      spyOn(this.analysisModel1, 'fetch').and.callFake(function (options) {
        this.analysisModel1.set('status', newStatus, { silent: true });
        options.success();
      }.bind(this));

      this.analysisModel1.set({
        'status': 'pending'
      });

      expect(this.analysisModel1.fetch).toHaveBeenCalled();
      expect(this.analysisModel1.fetch.calls.count()).toEqual(1);

      jasmine.clock().tick(1001);

      expect(this.analysisModel1.fetch.calls.count()).toEqual(1);
    });
  });
});
