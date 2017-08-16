var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var d3 = require('d3');
var WidgetHistogramChart = require('../../../src/widgets/histogram/chart');
var viewportUtils = require('../../../src/viewport-utils');
var formatter = require('../../../src/formatter');
require('moment-timezone');

function flushAllD3Transitions () {
  var now = Date.now;
  Date.now = function () { return Infinity; };
  d3.timer.flush();
  Date.now = now;
}

describe('widgets/histogram/chart', function () {
  var onWindowResizeReal;
  var onWindowResizeSpy;
  var generateHandlesSpy;
  var setupBrushSpy;
  var createFormatterSpy;

  afterEach(function () {
    $('.js-chart').remove();
  });

  beforeEach(function () {
    d3.select('body').append('svg').attr('class', 'js-chart');

    this.width = 300;
    this.height = 72;

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

    this.dataviewModel = new cdb.core.Model({
      aggregation: 'minute',
      offset: 0
    });
    this.dataviewModel.layer = new cdb.core.Model();

    this.view = new WidgetHistogramChart(({
      el: $('.js-chart'),
      type: 'histogram',
      margin: this.margin,
      chartBarColor: '#9DE0AD',
      hasHandles: true,
      height: this.height,
      data: this.data,
      dataviewModel: this.dataviewModel,
      originalData: this.originalModel,
      displayShadowBars: true,
      widgetModel: this.widgetModel,
      local_timezone: false,
      xAxisTickFormat: function (d, i) {
        return d;
      }
    }));

    var parentSpy = jasmine.createSpyObj('view.$el.parent()', ['width']);
    parentSpy.width.and.returnValue(this.width);
    spyOn(this.view.$el, 'parent');
    this.view.$el.parent.and.returnValue(parentSpy);

    generateHandlesSpy = spyOn(this.view, '_generateHandles');
    setupBrushSpy = spyOn(this.view, '_setupBrush');
    createFormatterSpy = spyOn(this.view, '_createFormatter');
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
      expect(this.view.$('.CDB-Chart-bar').size()).toBe(this.data.length);
    });

    it('should draw the axis', function () {
      expect(this.view.$el.find('.CDB-Chart-axis').size()).toBe(1);
    });

    it('should draw the handles', function () {
      generateHandlesSpy.and.callThrough();

      this.view._generateHandles();

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
      this.view.model.set({ data: updateHistogramData(20) });
      expect(this.view.refresh).toHaveBeenCalled();
    });

    describe('animated', function () {
      it('should set the parent width', function () {
        var animatedWidth = 24;
        spyOn(this.view.$el, 'siblings').and.returnValue($('<div>'));
        spyOn($.prototype, 'width').and.returnValue(animatedWidth);

        this.view.model.set('animated', true);
        this.view.show();
        this.view._resizeToParentElement();

        expect(this.view.model.get('width')).toBe(this.width - animatedWidth);
      });
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

  describe('touch interfaces fixes', function () {
    beforeEach(function () {
      setupBrushSpy.and.callThrough();

      this.view._setupBrush();
    });

    afterEach(function () {
      $('.Brush').remove();
    });

    it('should mark all brush elements with ps-prevent-touchmove', function () {
      var brush = this.view.$('.Brush');

      var hasProperClass = function (e) {
        return e.attributes.class.value.indexOf('ps-prevent-touchmove') !== 1;
      };

      var checkAllChildren = function (child) {
        expect(hasProperClass(child)).toBe(true);

        if (child.children && child.children.length > 0) {
          _.forEach(child.children, checkAllChildren);
        }
      };

      _.forEach(brush.children(), checkAllChildren);
    });
  });

  describe('._isTabletViewport', function () {
    it('should return true if viewport is tablet', function () {
      spyOn($.prototype, 'width').and.returnValue(100);
      spyOn(viewportUtils, 'isTabletViewport');

      this.view._isTabletViewport();

      expect(viewportUtils.isTabletViewport).toHaveBeenCalled();
    });
  });

  describe('._isMobileViewport', function () {
    it('should return true if viewport is mobile', function () {
      spyOn($.prototype, 'width').and.returnValue(100);
      spyOn(viewportUtils, 'isMobileViewport');

      this.view._isMobileViewport();

      expect(viewportUtils.isMobileViewport).toHaveBeenCalled();
    });
  });

  describe('._isTimeSeries', function () {
    it('should return true if option type is time', function () {
      expect(this.view._isTimeSeries()).toBe(false);

      this.view.options.type = 'time-date';

      expect(this.view._isTimeSeries()).toBe(true);
    });
  });

  describe('._generateChartContent', function () {
    it('should generate axis, lines, bars, bottom line, handles, and setup brush', function () {
      spyOn(this.view, '_generateAxis');
      spyOn(this.view, '_generateLines');
      spyOn(this.view, '_generateBars');
      spyOn(this.view, '_generateBottomLine');

      this.view._generateChartContent();

      expect(this.view._generateAxis).toHaveBeenCalled();
      expect(this.view._generateLines).toHaveBeenCalled();
      expect(this.view._generateBars).toHaveBeenCalled();
      expect(this.view._generateBottomLine).toHaveBeenCalled();
      expect(this.view._generateHandles).toHaveBeenCalled();
      expect(this.view._setupBrush).toHaveBeenCalled();
    });

    describe('time-series', function () {
      beforeEach(function () {
        this.view._isTimeSeries = function () {
          return true;
        };
      });

      describe('mobile', function () {
        beforeEach(function () {
          this.view._isMobileViewport = function () {
            return true;
          };
        });

        it('should not generate lines, bottom line', function () {
          spyOn(this.view, '_generateBottomLine');

          this.view._generateChartContent();

          expect(this.view._generateBottomLine).not.toHaveBeenCalled();
        });
      });

      describe('tablet', function () {
        beforeEach(function () {
          this.view._isTabletViewport = function () {
            return true;
          };
        });

        it('should not generate lines', function () {
          spyOn(this.view, '_generateLines');

          this.view._generateChartContent();

          expect(this.view._generateLines).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('._generateHandle', function () {
    beforeEach(function () {
      generateHandlesSpy.and.callThrough();

      var generateHandleSpy = spyOn(this.view, '_generateHandle');

      this.view._generateHandles();

      generateHandleSpy.and.callThrough();
    });

    afterEach(function () {
      $('.CDB-Chart-handles').remove();
    });

    it('should generate handle', function () {
      this.view._generateHandle('left');

      expect(this.view.$('.CDB-Chart-handle-left .CDB-Chart-handleRect').attr('height')).toBe('48');
    });

    describe('time-series', function () {
      beforeEach(function () {
        this.view._isTimeSeries = function () {
          return true;
        };
      });

      describe('tablet', function () {
        beforeEach(function () {
          this.view._isTabletViewport = function () {
            return true;
          };

          this.view.model.set({
            height: 16,
            margin: _.extend({}, this.view.model.get('margin'), { top: 0 }),
            showLabels: false
          }, { silent: true });
        });

        it('should generate handle', function () {
          this.view._generateHandle('left');

          expect(this.view.$('.CDB-Chart-handle-left .CDB-Chart-handleRect').attr('height')).toBe('24');
        });
      });
    });
  });

  describe('._generateAxisTip', function () {
    beforeEach(function () {
      generateHandlesSpy.and.callThrough();

      this.view._generateHandles();
    });

    afterEach(function () {
      $('.CDB-Chart-handles').remove();
    });

    describe('left', function () {
      it('should generate left axis tip', function () {
        this.view._generateAxisTip('left');

        var textLabel = this.view.$('.CDB-Chart-axisTipText.CDB-Chart-axisTip-left');
        var rectLabel = this.view.$('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-left');
        var axisTip = this.view.$('.CDB-Chart-axisTip.CDB-Chart-axisTip-left');
        var triangle = this.view.$('.CDB-Chart-handle-left .CDB-Chart-axisTipTriangle');

        expect(textLabel.attr('opacity')).toBe('1');
        expect(rectLabel.attr('opacity')).toBe('1');
        expect(triangle.attr('style')).toContain('opacity: 1;');

        expect(axisTip.length).toBe(1);
        expect(axisTip.attr('transform')).toBe('translate(0,-26)');
        expect(triangle.attr('transform')).toBe('translate(-3, -11)');
      });
    });

    describe('right', function () {
      it('should generate right axis tip', function () {
        this.view._generateAxisTip('right');

        var textLabel = this.view.$('.CDB-Chart-axisTipText.CDB-Chart-axisTip-right');
        var rectLabel = this.view.$('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-right');
        var axisTip = this.view.$('.CDB-Chart-axisTip.CDB-Chart-axisTip-right');
        var triangle = this.view.$('.CDB-Chart-handle-right .CDB-Chart-axisTipTriangle');

        expect(textLabel.attr('opacity')).toBe('1');
        expect(rectLabel.attr('opacity')).toBe('1');
        expect(triangle.attr('style')).toContain('opacity: 1;');

        expect(axisTip.length).toBe(1);
        expect(axisTip.attr('transform')).toBe('translate(0,57)');
        expect(triangle.attr('transform')).toBe('translate(-3, 59.1)');
      });
    });

    describe('time-series', function () {
      beforeEach(function () {
        this.view._isTimeSeries = function () {
          return true;
        };
      });

      describe('mobile', function () {
        beforeEach(function () {
          this.view._isMobileViewport = function () {
            return true;
          };
        });

        describe('right', function () {
          it('should generate right axis tip', function () {
            this.view._generateAxisTip('right');

            expect(this.view.$('.CDB-Chart-axisTip.CDB-Chart-axisTip-right').attr('transform')).toBe('translate(0,-26)');
            expect(this.view.$('.CDB-Chart-handle-right .CDB-Chart-axisTipTriangle').attr('transform')).toBe('translate(-3, -11)');
          });
        });
      });
    });
  });

  describe('._updateTriangle', function () {
    beforeEach(function () {
      generateHandlesSpy.and.callThrough();

      this.view.options.hasAxisTip = true;
      this.view._generateHandles();
    });

    it('should update triangle', function () {
      var triangle = this.view.$('.CDB-Chart-handle-left .CDB-Chart-axisTipTriangle');

      this.view._updateTriangle('left', triangle, 42);

      expect(triangle.attr('transform')).toBe('translate(-3,-11)rotate(0)skewX(0)scale(1,1)');
    });

    describe('time-series, tablet', function () {
      beforeEach(function () {
        this.view._isTimeSeries = function () {
          return true;
        };

        this.view._isTabletViewport = function () {
          return true;
        };

        this.view.model.set('right_axis_tip', 42);
      });

      it('should update right axis tip', function () {
        var triangle = this.view.$('.CDB-Chart-handle-right .CDB-Chart-axisTipTriangle');

        this.view._updateTriangle('right', triangle, 42);

        expect(triangle.attr('transform')).toBe('translate(-3,59.099998474121094)rotate(0)skewX(0)scale(1,1)');
      });
    });
  });

  describe('._updateAxisTip', function () {
    var time = 1501751014;

    beforeEach(function () {
      generateHandlesSpy.and.callThrough();

      this.view.options.hasAxisTip = true;
      this.view._generateHandles();
    });

    afterEach(function () {
      $('.CDB-Chart-handles').remove();
    });

    it('should update axis tip', function () {
      this.view.model.set('left_axis_tip', 42);
      this.view._updateAxisTip('left');

      expect(this.view.$('.CDB-Chart-axisTipText.CDB-Chart-axisTip-left').text()).toBe('42');
    });

    describe('left', function () {
      it('should update left axis tip', function () {
        this.view.model.set('left_axis_tip', 42);
        this.view._updateAxisTip('left');

        var axisTip = this.view.$('.CDB-Chart-axisTip.CDB-Chart-axisTip-left');

        expect(axisTip.attr('transform')).toBe('translate(-2, -26)');
      });
    });

    describe('right', function () {
      it('should update right axis tip', function () {
        this.view.model.set('right_axis_tip', 42);
        this.view._updateAxisTip('right');

        var axisTip = this.view.$('.CDB-Chart-axisTip.CDB-Chart-axisTip-right');

        expect(axisTip.attr('transform')).toBe('translate(-2, 57)');
      });
    });

    describe('datetime', function () {
      beforeEach(function () {
        createFormatterSpy.and.callThrough();

        this.view._isDateTimeSeries = function () {
          return true;
        };
        this.view._createFormatter();

        this.view.model.set('left_axis_tip', time);
      });

      it('should update axis tip', function () {
        this.view._updateAxisTip('left');

        expect(this.view.$('.CDB-Chart-axisTipText.CDB-Chart-axisTip-left').text()).toBe('09:03 08/03/2017');
      });
    });

    describe('time-series, mobile', function () {
      beforeEach(function () {
        this.view._isTimeSeries = function () {
          return true;
        };

        this.view._isMobileViewport = function () {
          return true;
        };

        this.view.model.set('right_axis_tip', 42);
      });

      it('should update right axis tip', function () {
        this.view._updateAxisTip('right');

        var axisTip = this.view.$('.CDB-Chart-axisTip.CDB-Chart-axisTip-right');

        expect(axisTip.attr('transform')).toBe('translate(-2, -26)');
      });

      describe('is dragging', function () {
        it('should show axis tip', function () {
          spyOn(this.view, '_showAxisTip');

          this.view.model.set('dragging', true);
          this.view._updateAxisTip('right');

          expect(this.view._showAxisTip).toHaveBeenCalledWith('right');
        });
      });
    });
  });

  describe('._onChangeDragging', function () {
    it('should update model', function () {
      this.view.model.set('dragging', true);

      expect(this.view.chart.classed('is-dragging')).toBe(true);

      this.view.model.set('dragging', false);

      expect(this.view.chart.classed('is-dragging')).toBe(false);
    });

    describe('if is mobile, time-series, and is not dragging', function () {
      beforeEach(function () {
        this.view._isMobileViewport = function () {
          return true;
        };

        this.view._isTimeSeries = function () {
          return true;
        };

        this.view.model.set('dragging', true);
      });

      it('should hide axis tips', function () {
        spyOn(this.view, '_hideAxisTip');

        this.view.model.set('dragging', false);

        expect(this.view._hideAxisTip).toHaveBeenCalledWith('right');
        expect(this.view._hideAxisTip).toHaveBeenCalledWith('left');
      });
    });
  });

  describe('._toggleAxisTip', function () {
    beforeEach(function () {
      jasmine.clock().install();

      generateHandlesSpy.and.callThrough();

      this.view.options.hasAxisTip = true;
      this.view._generateHandles();
    });

    afterEach(function () {
      jasmine.clock().uninstall();

      $('.CDB-Chart-handles').remove();
    });

    it('should toggle axis tip', function () {
      var textLabel = this.view.$('.CDB-Chart-axisTipText.CDB-Chart-axisTip-left');
      var rectLabel = this.view.$('.CDB-Chart-axisTipRect.CDB-Chart-axisTip-left');
      var triangle = this.view.$('.CDB-Chart-handle-left .CDB-Chart-axisTipTriangle');

      this.view._toggleAxisTip('left', 1);
      flushAllD3Transitions();

      expect(textLabel.attr('opacity')).toBe('1');
      expect(rectLabel.attr('opacity')).toBe('1');
      expect(triangle.attr('style')).toContain('opacity: 1;');

      this.view._toggleAxisTip('left', 0);
      flushAllD3Transitions();

      expect(textLabel.attr('opacity')).toBe('0');
      expect(rectLabel.attr('opacity')).toBe('0');
      expect(triangle.attr('style')).toContain('opacity: 0;');
    });
  });

  describe('._hideAxisTip', function () {
    it('should hide axis tip', function () {
      var tip = 'left';
      spyOn(this.view, '_toggleAxisTip');

      this.view._hideAxisTip(tip);

      expect(this.view._toggleAxisTip).toHaveBeenCalledWith(tip, 0);
    });
  });

  describe('._showAxisTip', function () {
    it('should show axis tip', function () {
      var tip = 'left';
      spyOn(this.view, '_toggleAxisTip');

      this.view._showAxisTip(tip);

      expect(this.view._toggleAxisTip).toHaveBeenCalledWith(tip, 1);
    });
  });

  describe('._setupBrush', function () {
    beforeEach(function () {
      setupBrushSpy.and.callThrough();

      this.view._setupBrush();
    });

    afterEach(function () {
      $('.Brush').remove();
    });

    it('should setup brush', function () {
      expect(this.view.$('.Brush rect').attr('height')).toBe('48');
    });

    describe('time-series', function () {
      beforeEach(function () {
        this.view._isTimeSeries = function () {
          return true;
        };
      });

      it('should generate handle', function () {
        expect(this.view.$('.Brush rect').attr('height')).toBe('48');
      });
    });
  });

  describe('._generateBars', function () {
    beforeEach(function () {
      generateHandlesSpy.and.callThrough();

      this.view._generateHandles();
    });

    afterEach(function () {
      $('.CDB-Chart-handles').remove();
    });

    it('should update chart', function () {
      this.view._updateChart();
      flushAllD3Transitions();

      expect(this.view.$('.CDB-Chart-bar').first().attr('height')).toBe('0');
      expect(this.view.$('.CDB-Chart-bar').last().attr('height')).toBe('48');

      expect(this.view.$('.CDB-Chart-bar').first().attr('y')).toBe('48');
      expect(this.view.$('.CDB-Chart-bar').last().attr('y')).toBe('0');
    });

    describe('mobile, time-series', function () {
      beforeEach(function () {
        this.view._isMobileViewport = function () {
          return true;
        };

        this.view._isTimeSeries = function () {
          return true;
        };

        this.view.model.set({
          height: 16,
          margin: _.extend({}, this.view.model.get('margin'), { top: 0 }),
          showLabels: false
        }, { silent: true });
      });

      it('should update chart', function () {
        this.view._updateChart();
        flushAllD3Transitions();

        expect(this.view.$('.CDB-Chart-bar').first().attr('height')).toBe('3');
        expect(this.view.$('.CDB-Chart-bar').last().attr('height')).toBe('3');

        expect(this.view.$('.CDB-Chart-bar').first().attr('y')).toBe('9');
        expect(this.view.$('.CDB-Chart-bar').last().attr('y')).toBe('9');
      });
    });
  });

  describe('._updateChart', function () {
    beforeEach(function () {
      generateHandlesSpy.and.callThrough();

      this.view._generateHandles();

      this.view.model.set({
        data: updateHistogramData(20)
      });
      flushAllD3Transitions();
    });

    afterEach(function () {
      $('.CDB-Chart-handles').remove();
    });

    it('should update chart', function () {
      expect(this.view.$('.CDB-Chart-bar').first().attr('height')).toBe('48');
      expect(this.view.$('.CDB-Chart-bar').last().attr('height')).toBe('0');

      expect(this.view.$('.CDB-Chart-bar').first().attr('y')).toBe('0');
      expect(this.view.$('.CDB-Chart-bar').last().attr('y')).toBe('48');
    });

    describe('mobile, time-series', function () {
      beforeEach(function () {
        this.view._isMobileViewport = function () {
          return true;
        };

        this.view._isTimeSeries = function () {
          return true;
        };

        this.view.model.set({
          height: 16,
          margin: _.extend({}, this.view.model.get('margin'), { top: 0 }),
          showLabels: false
        }, { silent: true });
      });

      it('should update chart', function () {
        this.view._updateChart();
        flushAllD3Transitions();

        expect(this.view.$('.CDB-Chart-bar').first().attr('height')).toBe('3');
        expect(this.view.$('.CDB-Chart-bar').last().attr('height')).toBe('3');

        expect(this.view.$('.CDB-Chart-bar').first().attr('y')).toBe('9');
        expect(this.view.$('.CDB-Chart-bar').last().attr('y')).toBe('9');
      });
    });
  });

  describe('._createFormatter', function () {
    beforeEach(function () {
      createFormatterSpy.and.callThrough();

      spyOn(formatter, 'timestampFactory');
      spyOn(this.view, '_calculateDivisionWithByAggregation');
    });

    it('should setup formatter', function () {
      this.view._createFormatter();

      expect(formatter.timestampFactory).not.toHaveBeenCalledWith();
      expect(this.view._calculateDivisionWithByAggregation).not.toHaveBeenCalledWith();
      expect(this.view.formatter).toBe(formatter.formatNumber);
    });

    describe('datetime', function () {
      it('should setup formatter', function () {
        this.view._isDateTimeSeries = function () {
          return true;
        };

        this.view._createFormatter();

        expect(formatter.timestampFactory).toHaveBeenCalledWith('minute', 0, false);
        expect(this.view._calculateDivisionWithByAggregation).toHaveBeenCalled();
        expect(this.view.formatter).not.toBe(formatter.formatNumber);
      });
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
      freq: i,
      start: start,
      end: end,
      max: end,
      min: start
    };
    arr.push(obj);
  });
  return arr;
}

function updateHistogramData (n) {
  n = n || 1;
  var arr = [];
  _.times(n, function (i) {
    var start = i;
    var end = i + 1;
    var obj = {
      bin: i,
      freq: n - end,
      start: start,
      end: end,
      max: end,
      min: start
    };
    arr.push(obj);
  });
  return arr;
}
