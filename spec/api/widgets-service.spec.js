var specHelper = require('../spec-helper');
var WidgetsService = require('../../src/api/widgets-service');
var WidgetsCollection = require('../../src/widgets/widgets-collection');

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

  describe('.createCategoryWidget', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          id: 'abc-123',
          title: 'some_title',
          column: 'my_column',
          aggregation: 'avg',
          prefix: '$',
          suffix: ' people'
        };
        this.widgetModel = this.widgetsService.createCategoryWidget(attrs, this.vis.map.layers.first());
      });

      it('should return a category widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should have id', function () {
        expect(this.widgetModel.id).toEqual('abc-123');
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
        expect(this.widgetModel.get('suffix')).toEqual(' people');
      });

      it('should have a prefix text', function () {
        expect(this.widgetModel.get('prefix')).toEqual('$');
      });

      it('should enable dataview by default', function () {
        expect(this.widgetModel.dataviewModel.get('sync_on_bbox_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('sync_on_data_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });

    describe('when given custom sync options', function () {
      beforeEach(function () {
        var attrs = {
          id: 'abc-123',
          title: 'some_title',
          column: 'my_column',
          aggregation: 'avg',
          suffix: ' people',
          sync_on_bbox_change: false,
          sync_on_data_change: false,
          enabled: false
        };
        this.widgetModel = this.widgetsService.createCategoryWidget(attrs, this.vis.map.layers.first());
      });

      it('should take them into account', function () {
        expect(this.widgetModel.dataviewModel.get('sync_on_bbox_change')).toBe(false);
        expect(this.widgetModel.dataviewModel.get('sync_on_data_change')).toBe(false);
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(false);
      });
    });

    it('when no aggregation specified should use the default operation', function () {
      this.widgetModel = this.widgetsService.createCategoryWidget({
        title: 'some_title',
        column: 'my_column'
      }, this.vis.map.layers.first());
      expect(this.widgetModel.dataviewModel.get('aggregation')).toEqual('count');
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createCategoryWidget({
            column: 'my_column'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });

      it('column', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createCategoryWidget({
            title: 'some_title'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });
    });
  });

  describe('.createHistogramWidget', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          id: 'abc-123',
          title: 'my histogram',
          column: 'a_column',
          bins: 20
        };
        this.widgetModel = this.widgetsService.createHistogramWidget(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should have id', function () {
        expect(this.widgetModel.id).toEqual('abc-123');
      });

      it('should set title', function () {
        expect(this.widgetModel.get('title')).toEqual('my histogram');
      });

      it('should set column', function () {
        expect(this.widgetModel.dataviewModel.get('column')).toEqual('a_column');
      });

      it('should set bins', function () {
        expect(this.widgetModel.dataviewModel.get('bins')).toEqual(20);
      });

      it('should enable dataview by default', function () {
        expect(this.widgetModel.dataviewModel.get('sync_on_bbox_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('sync_on_data_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });

    it('when no bins specified should use the default value', function () {
      this.widgetModel = this.widgetsService.createHistogramWidget({
        title: 'some_title',
        column: 'my_column'
      }, this.vis.map.layers.first());
      expect(this.widgetModel.dataviewModel.get('bins')).toEqual(10);
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createHistogramWidget({
            column: 'my_column'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });

      it('column', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createHistogramWidget({
            title: 'some_title'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });
    });
  });

  describe('.createFormulaWidget', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          id: 'abc-123',
          title: 'my formula',
          column: 'a_column',
          operation: 'sum',
          prefix: '$',
          suffix: '¢'
        };
        this.widgetModel = this.widgetsService.createFormulaWidget(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should have id', function () {
        expect(this.widgetModel.id).toEqual('abc-123');
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
        expect(this.widgetModel.get('suffix')).toEqual('¢');
      });

      it('should have a prefix text', function () {
        expect(this.widgetModel.get('prefix')).toEqual('$');
      });

      it('should enable dataview by default', function () {
        expect(this.widgetModel.dataviewModel.get('sync_on_bbox_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('sync_on_data_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createFormulaWidget({
            id: 'abc-123',
            column: 'my_column',
            operation: 'sum'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });

      it('column', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createFormulaWidget({
            title: 'some_title',
            operation: 'sum'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });

      it('operation', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createFormulaWidget({
            title: 'some_title',
            column: 'my_column'
          }, this.vis.map.layers.first());
        }).toThrowError();
      });
    });
  });

  describe('.createListWidget', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          id: 'abc-123',
          title: 'my list',
          columns: ['a', 'b'],
          columns_title: ['first', '2nd']
        };
        this.widgetModel = this.widgetsService.createListWidget(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should have id', function () {
        expect(this.widgetModel.id).toEqual('abc-123');
      });

      it('should set title', function () {
        expect(this.widgetModel.get('title')).toEqual('my list');
      });

      it('should set columns', function () {
        expect(this.widgetModel.dataviewModel.get('columns')).toEqual(['a', 'b']);
      });

      it('should set columns title', function () {
        expect(this.widgetModel.get('columns_title')).toEqual(['first', '2nd']);
      });

      it('should enable dataview by default', function () {
        expect(this.widgetModel.dataviewModel.get('sync_on_bbox_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('sync_on_data_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });

    describe('fails when the input has no', function () {
      it('title', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createListWidget({
            columns: ['a', 'b'],
            columns_title: ['first', '2nd']
          }, this.vis.map.layers.first());
        }).toThrowError();
      });

      it('columns', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createListWidget({
            title: 'my list',
            columns_title: ['first', '2nd']
          }, this.vis.map.layers.first());
        }).toThrowError();
      });

      it('columns_title', function () {
        expect(function () {
          this.widgetModel = this.widgetsService.createListWidget({
            title: 'my list',
            columns: ['a', 'b']
          }, this.vis.map.layers.first());
        }).toThrowError();
      });
    });
  });

  describe('.createTimeSeriesWidget', function () {
    describe('when given valid input', function () {
      beforeEach(function () {
        var attrs = {
          id: 'abc-123',
          column: 'dates',
          bins: 50,
          start: 0,
          end: 10
        };
        this.widgetModel = this.widgetsService.createTimeSeriesWidget(attrs, this.vis.map.layers.first());
      });

      it('should return a widget model', function () {
        expect(this.widgetModel).toBeDefined();
      });

      it('should have id', function () {
        expect(this.widgetModel.id).toEqual('abc-123');
      });

      it('should set column', function () {
        expect(this.widgetModel.dataviewModel.get('column')).toEqual('dates');
      });

      it('should be backed up by a histogram dataview model', function () {
        expect(this.widgetModel.dataviewModel.get('type')).toEqual('histogram');
      });

      it('should enable dataview by default', function () {
        expect(this.widgetModel.dataviewModel.get('sync_on_bbox_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('sync_on_data_change')).toBe(true);
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });
  });

  describe('fails when the input has no', function () {
    it('column', function () {
      expect(function () {
        this.widgetModel = this.widgetsService.createTimeSeriesWidget({
          title: 'some_title'
        }, this.vis.map.layers.first());
      }).toThrowError();
    });
  });
});
