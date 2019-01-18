var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisModel = require('../../../src/analysis/analysis-model');
var AnalysisPoller = require('../../../src/analysis/analysis-poller');

describe('src/analysis/analysis-poller', function () {
  beforeEach(function () {
    jasmine.clock().install();

    var engineMock = new Backbone.Model();
    this.reference = jasmine.createSpyObj('reference', ['getParamNamesForAnalysisType']);
    this.analysisModel1 = new AnalysisModel({
      id: 'a1',
      url: 'http://carto.com/foo/bar'
    }, { engine: engineMock, camshaftReference: this.reference });
    this.analysisPoller = new AnalysisPoller();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('.resetAnalysisNodes', function () {
    _.each([AnalysisModel.STATUS.PENDING, AnalysisModel.STATUS.WAITING, AnalysisModel.STATUS.RUNNING], function (status) {
      it('should start polling if status of an analysis is "' + status + '"', function () {
        this.analysisModel1.set({
          'status': status
        });

        spyOn(this.analysisModel1, 'fetch').and.callFake(function (options) {
          options.success();
        });

        this.analysisPoller.resetAnalysisNodes([ this.analysisModel1 ]);

        expect(this.analysisModel1.fetch).toHaveBeenCalled();
        expect(this.analysisModel1.fetch.calls.count()).toEqual(1);

        // Wait until next fetch is triggered
        jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY + 1);

        expect(this.analysisModel1.fetch.calls.count()).toEqual(2);

        // Wait until next fetch is triggered
        jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY * AnalysisPoller.CONFIG.DELAY_MULTIPLIER + 1);

        expect(this.analysisModel1.fetch.calls.count()).toEqual(3);
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

        this.analysisPoller.resetAnalysisNodes([ this.analysisModel1 ]);

        expect(this.analysisModel1.fetch).toHaveBeenCalled();
        expect(this.analysisModel1.fetch.calls.count()).toEqual(1);

        // Wait until next fetch is triggered
        jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY + 1);

        expect(this.analysisModel1.fetch.calls.count()).toEqual(1);
      });
    });
  });

  describe('.reset', function () {
    it('should reset all pollers', function () {
      this.analysisModel1.set({
        'status': 'pending'
      });

      spyOn(this.analysisModel1, 'fetch').and.callFake(function (options) {
        options.success();
      });

      this.analysisPoller.resetAnalysisNodes([ this.analysisModel1 ]);

      expect(this.analysisModel1.fetch).toHaveBeenCalled();
      expect(this.analysisModel1.fetch.calls.count()).toEqual(1);

      // Wait until next fetch is triggered
      jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY + 1);

      // Polling is working
      expect(this.analysisModel1.fetch.calls.count()).toEqual(2);

      this.analysisPoller.reset();

      // Wait until next fetch is supposed to be triggered
      jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY * AnalysisPoller.CONFIG.DELAY_MULTIPLIER + 1);

      // Polling  has been stopped
      expect(this.analysisModel1.fetch.calls.count()).toEqual(2);
    });
  });
});
