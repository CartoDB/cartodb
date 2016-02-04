var specHelper = require('./spec-helper');
var WidgetsService = require('../src/widgets-service');
var WidgetsCollection = require('../src/widgets/widgets-collection');

describe('widgets-service', function () {
  beforeEach(function () {
    this.vis = specHelper.createDefaultVis();
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
          title: 'some_title',
          column: 'my_column',
          aggregation: 'avg',
          suffix: ' people'
        };
        this.widgetModel = this.widgetsService.newCategoryModel(attrs, this.vis.map.layers.first());
      });

      it('should return a category widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should have a title', function () {
        expect(this.widgetModel.get('title')).toEqual('some_title');
      });

      it('should have a column', function () {
        expect(this.widgetModel.dataviewModel.get('column')).toEqual('my_column');
      });

      it('should have an aggregation operation', function () {
        expect(this.widgetModel.dataviewModel.get('aggregation')).toEqual('avg');
      });

      it('should have a suffix text', function () {
        expect(this.widgetModel.dataviewModel.get('suffix')).toEqual(' people');
      });

      it('should have a default prefix text', function () {
        expect(this.widgetModel.dataviewModel.get('prefix')).toEqual('');
      });
    });

    it('when no aggregation specified should use the default operation', function () {
      this.widgetModel = this.widgetsService.newCategoryModel({
        title: 'some_title',
        column: 'my_column'
      }, this.vis.map.layers.first());
      expect(this.widgetModel.dataviewModel.get('aggregation')).toEqual('count');
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        this.widgetModel = this.widgetsService.newCategoryModel({
          column: 'my_column'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });

      it('column', function () {
        this.widgetModel = this.widgetsService.newCategoryModel({
          title: 'some_title'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });
    });
  });

  describe('.newHistogramModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          title: 'my histogram',
          column: 'a_column',
          bins: 20
        };
        this.widgetModel = this.widgetsService.newHistogramModel(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should set title', function () {
        expect(this.widgetModel.get('title')).toEqual('my histogram');
      });

      it('should set column', function () {
        expect(this.widgetModel.dataviewModel.get('column')).toEqual('a_column');
      });

      it('should set default bins', function () {
        expect(this.widgetModel.dataviewModel.get('bins')).toEqual(20);
      });
    });

    it('when no bins specified should use the default value', function () {
      this.widgetModel = this.widgetsService.newHistogramModel({
        title: 'some_title',
        column: 'my_column'
      }, this.vis.map.layers.first());
      expect(this.widgetModel.dataviewModel.get('bins')).toEqual(10);
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        this.widgetModel = this.widgetsService.newHistogramModel({
          column: 'my_column'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });

      it('column', function () {
        this.widgetModel = this.widgetsService.newHistogramModel({
          title: 'some_title'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });
    });
  });

  describe('.newFormulaModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          title: 'my formula',
          column: 'a_column',
          operation: 'sum',
          prefix: 'hello'
        };
        this.widgetModel = this.widgetsService.newFormulaModel(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should set title', function () {
        expect(this.widgetModel.get('title')).toEqual('my formula');
      });

      it('should set column', function () {
        expect(this.widgetModel.dataviewModel.get('column')).toEqual('a_column');
      });

      it('should set operation', function () {
        expect(this.widgetModel.dataviewModel.get('operation')).toEqual('sum');
      });

      it('should have a default suffix text', function () {
        expect(this.widgetModel.dataviewModel.get('suffix')).toEqual('');
      });

      it('should have a prefix text', function () {
        expect(this.widgetModel.dataviewModel.get('prefix')).toEqual('hello');
      });
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        this.widgetModel = this.widgetsService.newFormulaModel({
          column: 'my_column',
          operation: 'sum'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });

      it('column', function () {
        this.widgetModel = this.widgetsService.newFormulaModel({
          title: 'some_title',
          operation: 'sum'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });

      it('operation', function () {
        this.widgetModel = this.widgetsService.newFormulaModel({
          title: 'some_title',
          column: 'my_column'
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });
    });
  });

  describe('.newListModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          title: 'my list',
          columns: ['a', 'b'],
          columns_title: ['first', '2nd']
        };
        this.widgetModel = this.widgetsService.newListModel(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should set title', function () {
        expect(this.widgetModel.get('title')).toEqual('my list');
      });

      it('should set columns', function () {
        expect(this.widgetModel.dataviewModel.get('columns')).toEqual(['a', 'b']);
      });

      it('should set columns title', function () {
        expect(this.widgetModel.dataviewModel.get('columns_title')).toEqual(['first', '2nd']);
      });
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        this.widgetModel = this.widgetsService.newListModel({
          columns: ['a', 'b'],
          columns_title: ['first', '2nd']
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });

      it('columns', function () {
        this.widgetModel = this.widgetsService.newListModel({
          title: 'my list',
          columns_title: ['first', '2nd']
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });

      it('columns_title', function () {
        this.widgetModel = this.widgetsService.newListModel({
          title: 'my list',
          columns: ['a', 'b']
        }, this.vis.map.layers.first());
        expect(this.widgetModel).not.toBeDefined();
      });
    });
  });

  describe('.newTimeSeriesModel', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          column: 'dates'
        };
        this.widgetModel = this.widgetsService.newTimeSeriesModel(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should set column', function () {
        expect(this.widgetModel.dataviewModel.get('column')).toEqual('dates');
      });

      it('should be backed up by a histogram dataview model', function () {
        expect(this.widgetModel.dataviewModel.get('type')).toEqual('histogram');
      });
    });
  });

  describe('fails when the input has no', function () {
    it('column', function () {
      this.widgetModel = this.widgetsService.newTimeSeriesModel({
        title: 'some_title'
      }, this.vis.map.layers.first());
      expect(this.widgetModel).not.toBeDefined();
    });
  });
});
