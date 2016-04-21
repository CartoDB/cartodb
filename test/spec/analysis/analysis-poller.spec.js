var _ = require('underscore');
var AnalysisModel = require('../../../src/analysis/analysis-model');
var AnalysisPoller = require('../../../src/analysis/analysis-poller');

describe('src/analysis/analysis-poller', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.map = jasmine.createSpyObj('map', ['something']);
    this.reference = jasmine.createSpyObj('reference', ['getParamNamesForAnalysisType']);
    this.analysisModel1 = new AnalysisModel({ id: 'a1' }, { map: this.map, camshaftReference: this.reference });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('.poll', function () {
    beforeEach(function () {
    });

    _.each([AnalysisModel.STATUS.PENDING, AnalysisModel.STATUS.WAITING, AnalysisModel.STATUS.RUNNING], function (status) {
      it('should start polling if status of an analysis is "' + status + '"', function () {
        this.analysisModel1.set({
          'status': status
        });

        spyOn(this.analysisModel1, 'fetch').and.callFake(function (options) {
          options.success();
        });

        AnalysisPoller.poll(this.analysisModel1);

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

        AnalysisPoller.poll(this.analysisModel1);

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

      AnalysisPoller.poll(this.analysisModel1);

      expect(this.analysisModel1.fetch).toHaveBeenCalled();
      expect(this.analysisModel1.fetch.calls.count()).toEqual(1);

      // Wait until next fetch is triggered
      jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY + 1);

      // Polling is working
      expect(this.analysisModel1.fetch.calls.count()).toEqual(2);

      AnalysisPoller.reset();

      // Wait until next fetch is supposed to be triggered
      jasmine.clock().tick(AnalysisPoller.CONFIG.START_DELAY * AnalysisPoller.CONFIG.DELAY_MULTIPLIER + 1);

      // Polling  has been stopped
      expect(this.analysisModel1.fetch.calls.count()).toEqual(2);
    });
  });
});
