var WidgetsService = require('../src/widgets-service');
var WidgetsCollection = require('../src/widgets/widgets-collection');

describe('widgets-service', function () {
  beforeEach(function () {
    this.vis = cdb.createVis(document.createElement('div'), {
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{type: 'torque'}]
    });
    this.widgetsCollection = new WidgetsCollection();
    this.widgetsService = new WidgetsService(this.widgetsCollection, this.vis.dataviews);
  });

  it('should return the WidgetsService instance', function () {
    expect(this.widgetsService).toBeDefined();
  });

  describe('.get', function () {
    it('should return the corresponding widgetModel for given id', function () {
      expect(this.widgetsService.get('some-id')).toBeUndefined();

      var aWidgetModel = this.widgetsCollection.add({
        id: 'some-id'
      });
      expect(this.widgetsService.get('some-id')).toBe(aWidgetModel);
    });
  });

  describe('.newCategoryModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          options: {}
        };
        this.results = this.widgetsService.newCategoryModel(attrs, this.vis.map.layers.first());
      });

      it('should return a category widget model', function () {
        expect(this.results).toBeDefined();
      });
    });
  });

  describe('.newHistogramModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          options: {}
        };
        this.results = this.widgetsService.newHistogramModel(attrs, this.vis.map.layers.first());
      });

      it('should return a histogram widget model', function () {
        expect(this.results).toBeDefined();
      });
    });
  });

  describe('.newFormulaModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          options: {}
        };
        this.results = this.widgetsService.newFormulaModel(attrs, this.vis.map.layers.first());
      });

      it('should return a histogram widget model', function () {
        expect(this.results).toBeDefined();
      });
    });
  });

  describe('.newListModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          options: {}
        };
        this.results = this.widgetsService.newListModel(attrs, this.vis.map.layers.first());
      });

      it('should return a histogram widget model', function () {
        expect(this.results).toBeDefined();
      });
    });
  });

  describe('.newTimeSeriesModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          options: {}
        };
        this.results = this.widgetsService.newTimeSeriesModel(attrs, this.vis.map.layers.first());
      });

      it('should return a histogram widget model', function () {
        expect(this.results).toBeDefined();
      });

      it('should be backed up by a histogram dataview model', function () {
        expect(this.results.dataviewModel.get('type')).toEqual('histogram');
      });
    });
  });
});
