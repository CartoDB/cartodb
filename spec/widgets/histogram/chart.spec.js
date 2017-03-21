var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var d3 = require('d3');
var WidgetHistogramChart = require('../../../src/widgets/histogram/chart');

describe('widgets/histogram/chart', function () {
  var onWindowResizeReal;
  var onWindowResizeSpy;

  afterEach(function () {
    $('.js-chart').remove();
  });

  beforeEach(function () {
    d3.select('body').append('svg').attr('class', 'js-chart');

    this.width = 300;
    this.height = 100;

    d3.select($('.js-chart')[0])
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('class', 'Canvas');

    this.data = genHistogramData(20);
    this.margin = {
      top: 4,
      right: 4,
      bottom: 4,
      left: 4
    };

    this.originalData = genHistogramData(20);
    this.originalModel = new cdb.core.Model({
      data: this.originalData,
      start: this.originalData[0].start,
      end: this.originalData[this.originalData.length - 1].end,
      bins: 20
    });
    this.originalModel.getData = function () {
      return this.originalData;
    }.bind(this);

    // override default behavior of debounce, to be able to control callback
    onWindowResizeSpy = jasmine.createSpy('_onWindowResize');
    spyOn(_, 'debounce').and.callFake(function (cb) {
      onWindowResizeReal = cb;
      return onWindowResizeSpy;
    });

    this.widgetModel = new cdb.core.Model({
      style: {
        auto_style: {
          definition: {
            point: {
              color: {
                attribute: 'whatever',
                range: ['#FABADA', '#F00000', '#000000']
              }
            }
          }
        }
      }
    });

    this.widgetModel.getWidgetColor = function () { return ''; };
    this.widgetModel.getAutoStyle = function () { return this.attributes.style.auto_style; };
    this.widgetModel.isAutoStyleEnabled = function () { return true; };
    this.widgetModel.isAutoStyle = function () { return false; };

    spyOn(WidgetHistogramChart.prototype, '_refreshBarsColor').and.callThrough();
    spyOn(WidgetHistogramChart.prototype, '_setupFillColor').and.callThrough();

    this.dataviewModel = new cdb.core.Model();
    this.dataviewModel.layer = new cdb.core.Model();

    this.view = new WidgetHistogramChart(({
      el: $('.js-chart'),
      margin: this.margin,
      chartBarColor: '#9DE0AD',
      hasHandles: true,
      height: 100,
      data: this.data,
      dataviewModel: this.dataviewModel,
      originalData: this.originalModel,
      displayShadowBars: true,
      widgetModel: this.widgetModel,
      xAxisTickFormat: function (d, i) {
        return d;
      }
    }));

    var parentSpy = jasmine.createSpyObj('view.$el.parent()', ['width']);
    parentSpy.width.and.returnValue(this.width);
    spyOn(this.view.$el, 'parent');
    this.view.$el.parent.and.returnValue(parentSpy);

    spyOn(this.view, 'refresh').and.callThrough();

    this.view.render();
  });

  it('should be hidden initially', function () {
    expect(this.view.$el.attr('style')).toMatch('none');
  });

  it('should setup the fill color initially', function () {
    expect(WidgetHistogramChart.prototype._setupFillColor).toHaveBeenCalled();
    expect(this.view._autoStyleColorsScale).toBeUndefined();
  });

  describe('normalize', function () {
    it('should normalize', function () {
      spyOn(this.view, 'updateYScale');
      this.view.setNormalized(true);
      expect(this.view.model.get('normalized')).toEqual(true);
      expect(this.view.updateYScale).toHaveBeenCalled();
      expect(this.view.refresh).toHaveBeenCalled();
    });

    it('should denormalize', function () {
      spyOn(this.view, 'updateYScale');
      this.view.setNormalized(false);
      expect(this.view.model.get('normalized')).toEqual(false);
      expect(this.view.updateYScale).toHaveBeenCalled();
      expect(this.view.refresh).toHaveBeenCalled();
    });
  });

  describe('shadow bars', function () {
    it('should not show shadow bars', function () {
      this.view.options.displayShadowBars = false;
      this.view.model.set('show_shadow_bars', false);
      expect(this.view.$('.CDB-Chart-shadowBars').length).toBe(0);
      this.originalModel.trigger('change:data');
      expect(this.view.$('.CDB-Chart-shadowBars').length).toBe(0);
      this.view.showShadowBars();
      expect(this.view.$('.CDB-Chart-shadowBars').length).toBe(0);
    });

    it('should remove and generate shadow bars when original data chagnes', function () {
      spyOn(this.view, '_removeShadowBars');
      spyOn(this.view, '_generateShadowBars');
      this.originalModel.trigger('change:data');
      expect(this.view._removeShadowBars).toHaveBeenCalled();
      expect(this.view._generateShadowBars).toHaveBeenCalled();
    });
  });

  describe('when view is resized but set to not be shown just yet', function () {
    beforeEach(function () {
      expect(this.view.options.showOnWidthChange).toBe(true); // assert default value, in case it's changed
      this.view.options.showOnWidthChange = false;
    });

    it('should not show view', function () {
      expect(this.view.$el.attr('style')).toMatch('none');
    });
  });

  describe('when view is resized', function () {
    beforeEach(function () {
      onWindowResizeReal.call(this);
      expect(this.view.$el.parent).toHaveBeenCalled();
    });

    it('should render the view', function () {
      expect(this.view.$el.attr('style')).not.toMatch('none');
    });

    it('should calculate the width of the bars', function () {
      expect(this.view.barWidth).toBe((this.width - this.margin.left - this.margin.right) / this.data.length);
    });

    it('should draw the bars', function () {
      expect(this.view.$el.find('.CDB-Chart-bar').size()).toBe(this.data.length);
    });

    it('should draw the axis', function () {
      expect(this.view.$el.find('.CDB-Chart-axis').size()).toBe(1);
    });

    it('should draw the handles', function () {
      expect(this.view.$el.find('.CDB-Chart-handle').size()).toBe(2);
    });

    it('should hide the chart', function () {
      expect(this.view.$el.css('display')).toBe('inline');

      this.view.hide();

      expect(this.view.isHidden()).toBe(true);
      expect(this.view.model.get('display')).toBe(false);
      expect(this.view.$el.css('display')).toBe('none');
    });

    it('should show the chart', function () {
      this.view.hide();
      this.view.show();
      expect(this.view.$el.css('display')).toBe('inline');
    });

    it('should set the parent width', function () {
      this.view.show();
      this.view._resizeToParentElement();
      expect(this.view.model.get('width')).toBe(this.width);
    });

    it('should generate the shadow bars', function () {
      expect(this.view.$el.find('.CDB-Chart-shadowBars').length).toBe(1);
    });

    it('should hide the shadow bars', function () {
      this.view.removeShadowBars();
      expect(this.view.$el.find('.CDB-Chart-shadowBars').length).toBe(0);
    });

    it('should maintain the visibility after calling _resizeToParentElement', function () {
      this.view.show();
      this.view.$el.parent().width();
      this.view._resizeToParentElement();
      expect(this.view.$el.css('display')).toBe('inline');
      expect(this.view.model.get('display')).toBe(true);

      this.view.hide();
      this.view._resizeToParentElement();
      expect(this.view.$el.css('display')).toBe('none');
      expect(this.view.model.get('display')).toBe(false);
    });

    it('should calculate the scales', function () {
      expect(this.view.xScale(0)).toBe(0);
      expect(this.view.xScale(100)).toMatch(/\d+/);
      expect(this.view.xScale(100)).toEqual(this.view.chartWidth());
      expect(this.view.yScale(0)).toMatch(/\d+/);
      expect(this.view.yScale(0)).toEqual(this.view.chartHeight());
    });

    it('should refresh the data', function () {
      this.view.show();
      this.view.model.set({ data: genHistogramData(20) });
      expect(this.view.refresh).toHaveBeenCalled();
    });

    describe('should allow to manage the y scale', function () {
      beforeEach(function () {
        this.originalScale = this.view.yScale;
        this.view.model.set('data', genHistogramData(10));
      });

      it('should calculate the y scale on request', function () {
        expect(this.view.yScale).toEqual(this.originalScale);

        this.view.updateYScale();
        expect(this.view.yScale).not.toEqual(this.originalScale);
      });

      it('should restore the y scale on request', function () {
        this.view.resetYScale();
        expect(this.view.yScale).toEqual(this.originalScale);
      });
    });
  });

  describe('_calculateDataDomain', function () {
    beforeEach(function () {
      this.applyNewData = function (d) {
        this.view.model.attributes.data = d;
      };
    });

    describe('without filter', function () {
      beforeEach(function () {
        spyOn(this.view, '_hasFilterApplied').and.returnValue(false);
      });

      describe('all bins with freq data', function () {
        it('should return the min and max value from the first and last bins', function () {
          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 1
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 2
            }
          ]);

          expect(this.view._calculateDataDomain()).toEqual([0, 6]);
        });

        it('should return null when there is no data', function () {
          this.applyNewData([]);

          expect(this.view._calculateDataDomain()).toEqual([null, null]);
        });
      });

      describe('not all bins with freq data', function () {
        it('should return start and end values from bins with frequency (1)', function () {
          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 2
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([2.1, 6]);
        });

        it('should return start and end values from bins with frequency (2)', function () {
          this.applyNewData([
            {
              min: 1,
              max: 2,
              freq: 2
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 6.1,
              max: 8,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([1, 4]);
        });

        it('should return start and end values from bins with frequency (3)', function () {
          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 2
            },
            {
              min: 6.1,
              max: 8,
              freq: 0
            }
          ]);

          expect(this.view._calculateDataDomain()).toEqual([2.1, 6]);
        });

        it('should return start and end values from bins with frequency (4)', function () {
          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 0
            },
            {
              min: 6.1,
              max: 8,
              freq: 10
            },
            {
              min: 8.1,
              max: 12,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([2.1, 8]);
        });

        it('should return null when there is no data', function () {
          this.applyNewData([]);

          expect(this.view._calculateDataDomain()).toEqual([null, null]);
        });
      });
    });

    describe('with filter', function () {
      beforeEach(function () {
        spyOn(this.view, '_hasFilterApplied').and.returnValue(true);
      });

      describe('all bins with freq data', function () {
        it('should return the min and max value from the first and last bins', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(1);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(2);

          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 1
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 2
            }
          ]);

          expect(this.view._calculateDataDomain()).toEqual([2.1, 4]);
        });
      });

      describe('not all bins with freq data', function () {
        it('should return start and end values from bins with frequency (1)', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(1);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(2);

          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([2.1, 4]);
        });

        it('should return start and end values from bins with frequency (2)', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(1);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(3);

          this.applyNewData([
            {
              min: 1,
              max: 2,
              freq: 2
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 6.1,
              max: 8,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([2.1, 4]);
        });

        it('should return start and end values from bins with frequency (3)', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(0);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(4);

          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 2
            },
            {
              min: 6.1,
              max: 8,
              freq: 0
            },
            {
              min: 8.1,
              max: 10,
              freq: 2
            }
          ]);

          expect(this.view._calculateDataDomain()).toEqual([2.1, 6]);
        });

        it('should return start and end values from bins with frequency (4)', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(1);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(4);

          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 3
            },
            {
              min: 4.1,
              max: 6,
              freq: 0
            },
            {
              min: 6.1,
              max: 8,
              freq: 10
            },
            {
              min: 8.1,
              max: 12,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([2.1, 8]);
        });

        it('should return start and end values from bins with frequency (5)', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(1);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(5);

          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 0
            },
            {
              min: 4.1,
              max: 6,
              freq: 0
            },
            {
              min: 6.1,
              max: 8,
              freq: 0
            },
            {
              min: 8.1,
              max: 12,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([2.1, 12]);
        });

        it('should return 0, 0 when lo and hi bar indexes are NaN', function () {
          spyOn(this.view, '_getLoBarIndex').and.returnValue(NaN);
          spyOn(this.view, '_getHiBarIndex').and.returnValue(NaN);

          this.applyNewData([
            {
              min: 0,
              max: 2,
              freq: 0
            },
            {
              min: 2.1,
              max: 4,
              freq: 0
            },
            {
              min: 4.1,
              max: 6,
              freq: 0
            },
            {
              min: 6.1,
              max: 8,
              freq: 0
            },
            {
              min: 8.1,
              max: 12,
              freq: 0
            }
          ]);
          expect(this.view._calculateDataDomain()).toEqual([0, 0]);
        });
      });
    });
  });

  describe('_generateFillGradients', function () {
    beforeEach(function () {
      this.redColor = 'rgb(255, 0, 0)';
      this.yellowColor = 'rgb(255, 255, 0)';

      this.getLinearGradients = function () {
        var defs = d3.select(this.view.el).select('defs');
        return defs.selectAll('linearGradient');
      };

      var definitionObj = {
        definition: {
          point: {
            color: {
              range: [this.redColor, 'blue', 'brown', this.yellowColor]
            }
          }
        }
      };
      spyOn(this.view._widgetModel, 'getAutoStyle').and.returnValue(definitionObj);

      var data = [
        {
          min: 0,
          max: 2,
          freq: 5
        },
        {
          min: 2.1,
          max: 4,
          freq: 1
        },
        {
          min: 4.1,
          max: 6,
          freq: 5
        },
        {
          min: 6.1,
          max: 8,
          freq: 8
        },
        {
          min: 8.1,
          max: 12,
          freq: 10
        }
      ];

      this.view.model.attributes.data = data;
      this.view._removeFillGradients();
      this.view.el = document.createElement('svg'); // Hack it!
    });

    it('should not generate any gradient if auto-style colors are not provided', function () {
      this.view._widgetModel.getAutoStyle.and.returnValue({});
      this.view._generateFillGradients();
      expect(this.getLinearGradients().length).toBe(0);
    });

    it('should generate as many gradients as data we have', function () {
      this.view._generateFillGradients();
      expect(this.getLinearGradients()[0].length).toBe(5);
    });

    it('should generate 5 stops in each gradient', function () {
      this.view._generateFillGradients();

      this.getLinearGradients().each(function (d) {
        var stops = d3.select(this).selectAll('stop');
        expect(stops[0].length).toBe(5);
      });
    });

    describe('gradient generation', function () {
      describe('no colors ramp', function () {
        it('should not create the proper gradient ramp if bucket is out of domain', function () {
          spyOn(this.view, '_calculateDataDomain').and.returnValue([2.1, 8]);
          this.view._generateFillGradients();
          var self = this;

          // Out of domain at the beginning
          d3.select(this.getLinearGradients()[0][0]).selectAll('stop').each(function (d) {
            expect(this.getAttribute('stop-color')).toBe(self.redColor);
          });

          // Out of domain at the end
          d3.select(this.getLinearGradients()[0][4]).selectAll('stop').each(function (d) {
            expect(this.getAttribute('stop-color')).toBe(self.yellowColor);
          });
        });

        it('should not create the proper gradient ramp if bucket is empty at the beginning', function () {
          var self = this;

          this.view.model.attributes.data[0].freq = 0;
          this.view._generateFillGradients();

          // No data in the first bucket
          d3.select(this.getLinearGradients()[0][0]).selectAll('stop').each(function (d) {
            expect(this.getAttribute('stop-color')).toBe(self.redColor);
          });
        });

        it('should not create the proper gradient ramp if bucket is empty at the end', function () {
          this.view.model.attributes.data[4].freq = 0;
          this.view._generateFillGradients();

          var self = this;

          // No data in the last bucket
          d3.select(this.getLinearGradients()[0][4]).selectAll('stop').each(function (d) {
            expect(this.getAttribute('stop-color')).toBe(self.yellowColor);
          });
        });
      });

      describe('colors ramp', function () {
        it('should generate the proper ramp for each gradient', function () {
          this.view._generateFillGradients();

          var linearGradients = this.getLinearGradients();
          var firstGradient = linearGradients[0][0];
          var lastGradient = linearGradients[0][4];
          var middleGradient = linearGradients[0][2];

          var stopsInFirstGradient = d3.select(firstGradient).selectAll('stop');
          var stopsInMiddleGradient = d3.select(middleGradient).selectAll('stop');
          var stopsInLastGradient = d3.select(lastGradient).selectAll('stop');

          expect(stopsInFirstGradient[0][0].getAttribute('stop-color')).toBe(this.redColor);
          expect(stopsInFirstGradient[0][1].getAttribute('stop-color')).not.toBe(this.redColor);
          expect(stopsInLastGradient[0][4].getAttribute('stop-color')).toBe(this.yellowColor);
          expect(stopsInLastGradient[0][3].getAttribute('stop-color')).not.toBe(this.yellowColor);

          // Checking middle bin gradient
          expect(stopsInMiddleGradient[0][0].getAttribute('stop-color')).toBe('rgb(69, 8, 177)'); // From blue
          expect(stopsInMiddleGradient[0][1].getAttribute('stop-color')).toBe('rgb(68, 11, 175)');
          expect(stopsInMiddleGradient[0][2].getAttribute('stop-color')).toBe('rgb(71, 14, 168)');
          expect(stopsInMiddleGradient[0][3].getAttribute('stop-color')).toBe('rgb(79, 19, 157)');
          expect(stopsInMiddleGradient[0][4].getAttribute('stop-color')).toBe('rgb(90, 25, 142)'); // To purple
        });

        it('should create the proper gradient ramp althogh all buckets are empty', function () {
          var data = this.view.model.attributes.data;
          _.each(data, function (d, i) {
            d.freq = 0;
          });
          this.view._generateFillGradients();

          var linearGradients = this.getLinearGradients();
          var firstGradient = linearGradients[0][0];
          var lastGradient = linearGradients[0][4];
          var stopsInFirstGradient = d3.select(firstGradient).selectAll('stop');
          var stopsInLastGradient = d3.select(lastGradient).selectAll('stop');

          // No data in the last bucket
          expect(stopsInFirstGradient[0][0].getAttribute('stop-color')).toBe(this.redColor);
          expect(stopsInFirstGradient[0][1].getAttribute('stop-color')).not.toBe(this.redColor);
          expect(stopsInLastGradient[0][4].getAttribute('stop-color')).toBe(this.yellowColor);
          expect(stopsInLastGradient[0][3].getAttribute('stop-color')).not.toBe(this.yellowColor);
        });
      });
    });
  });

  describe('on dataview layer cartocss change', function () {
    it('should generate bar gradients if they were not defined before', function () {
      this.view._setupFillColor.calls.reset();
      spyOn(this.view, '_areGradientsAlreadyGenerated').and.returnValue(false);
      this.dataviewModel.layer.set('cartocss', '#dummy {}');
      expect(this.view._setupFillColor.calls.count()).toBe(1);
    });

    it('should not generate bar gradients if they were defined before', function () {
      this.view._setupFillColor.calls.reset();
      spyOn(this.view, '_areGradientsAlreadyGenerated').and.returnValue(true);
      this.dataviewModel.layer.set('cartocss', '#dummy {}');
      expect(this.view._setupFillColor.calls.count()).toBe(0);
    });
  });

  describe('._getDataForScales', function () {
    it('should calculate (x|y)Scale depending originalData if it is provided and view is not bounded', function () {
      var data = this.view._getDataForScales();
      expect(data).toBe(this.originalData);
      expect(data).not.toBe(this.data);
    });

    it('should calculate (x|y)Scale depending current data if view is bounded', function () {
      this.view.model.set('bounded', true);
      var data = this.view._getDataForScales();
      expect(data).not.toBe(this.originalData);
      expect(data).toBe(this.data);
    });

    it('should calculate (x|y)Scale depending current data if originalData is not defined', function () {
      delete this.view._originalData;
      var data = this.view._getDataForScales();
      expect(data).not.toBe(this.originalData);
      expect(data).toBe(this.data);
    });
  });

  describe('autostyle changes', function () {
    beforeEach(function () {
      this.widgetModel.set('autoStyle', true);
    });

    it('should trigger a refresh of the bars fill color', function () {
      expect(WidgetHistogramChart.prototype._refreshBarsColor).toHaveBeenCalled();
    });
  });

  describe('style changes', function () {
    beforeEach(function () {
      WidgetHistogramChart.prototype._setupFillColor.calls.reset();
      WidgetHistogramChart.prototype._refreshBarsColor.calls.reset();
      this.widgetModel.set('style', {});
    });

    it('should trigger a refresh of the bars fill color', function () {
      expect(WidgetHistogramChart.prototype._refreshBarsColor.calls.count()).toEqual(1);
    });

    it('should setup the colors scale', function () {
      expect(WidgetHistogramChart.prototype._setupFillColor.calls.count()).toEqual(1);
    });
  });

  describe('color bar', function () {
    it('should be green by default', function () {
      expect(this.view.$('.CDB-Chart-bar').attr('fill')).toEqual('#9DE0AD');
    });

    it('should be custom if widget color is different', function () {
      spyOn(this.widgetModel, 'getWidgetColor').and.returnValue('red');
      this.view._refreshBarsColor();
      expect(this.view.$('.CDB-Chart-bar').attr('fill')).toEqual('red');
    });

    it('should be colored by linear gradients when autostyle is applied', function () {
      spyOn(this.widgetModel, 'isAutoStyle').and.returnValue(true);
      this.widgetModel.set({
        style: {
          auto_style: {
            definition: {
              point: {
                color: {
                  attribute: 'whatever',
                  range: ['red', 'blue', 'green']
                }
              }
            }
          }
        }
      });

      var dataSize = this.view.model.get('data').length;
      _.times(dataSize, function (i) {
        expect(this.view.$('.CDB-Chart-bar:eq(' + i + ')').attr('fill')).toContain('url(#bar-');
      }, this);
    });
  });
});

function genHistogramData (n) {
  n = n || 1;
  var arr = [];
  _.times(n, function (i) {
    var start = i;
    var end = i + 1;
    var obj = {
      bin: i,
      freq: Math.round(Math.random() * 10),
      start: start,
      end: end,
      max: end,
      min: start
    };
    arr.push(obj);
  });
  return arr;
}
