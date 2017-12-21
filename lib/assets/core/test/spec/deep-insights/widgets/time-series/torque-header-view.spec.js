var Backbone = require('backbone');
var TorqueHeaderView = require('../../../src/widgets/time-series/torque-header-view');

describe('widgets/time-series/torque-header-view', function () {
  var filterIsEmpty = true;
  var timeSeriesModel = new Backbone.Model({
    title: 'Morty'
  });

  beforeEach(function () {
    this.dataviewModel = new Backbone.Model({
      data: [{}]
    });
    this.dataviewModel.getColumnType = function () {
      return 'number';
    };

    this.dataviewModel.layer = new Backbone.Model();
    this.dataviewModel.filter = new Backbone.Model();
    this.dataviewModel.filter.isEmpty = function () {
      return filterIsEmpty;
    };
    this.torqueLayerModel = new Backbone.Model();
    this.view = new TorqueHeaderView({
      dataviewModel: this.dataviewModel,
      torqueLayerModel: this.torqueLayerModel,
      timeSeriesModel: timeSeriesModel,
      selectedAmount: 0
    });
  });

  afterEach(function () {
    filterIsEmpty = true;
  });

  describe('.render', function () {
    it('should render the proper template', function () {
      this.view.render();

      expect(this.view.$('.js-torque-controls').length).toBe(1);
      expect(this.view.$('.js-time-series-header').length).toBe(1);
    });

    it('should render and update the title', function () {
      this.view.render();

      expect(this.view.$('.js-widget-title').text()).toBe('Morty');

      timeSeriesModel.set('title', 'Rick');

      expect(this.view.$('.js-widget-title').text()).toBe('Rick');
    });

    it('should render torque controls and hide clear button if filter is empty', function () {
      this.view.render();

      // Torque time info rendered
      expect(this.view.$('.CDB-Widget-timeSeriesTimeInfo').length).toBe(1);
      // Header clear button not present
      expect(this.view.$('.js-clear').length).toBe(0);
    });

    it('should not render torque controls and show clear button if filter has value', function () {
      filterIsEmpty = false;
      this.dataviewModel.filter.set({ min: 1, max: 2 });

      this.view.render();

      // Torque time info not rendered
      expect(this.view.$('.CDB-Widget-timeSeriesTimeInfo').length).toBe(0);
      // Header clear button present
      expect(this.view.$('.js-clear').length).toBe(1);
    });
  });
});
