var specHelper = require('../../spec-helper');
var HistogramWidgetModel = require('../../../../../javascripts/deep-insights/widgets/histogram/histogram-widget-model');
var HistogramTitleView = require('../../../../../javascripts/deep-insights/widgets/histogram/histogram-title-view');

describe('widgets/histogram/title-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.layer = vis.map.layers.first();
    this.layer.restoreCartoCSS = jasmine.createSpy('restore');
    this.layer.getGeometryType = function () {
      return 'polygon';
    };
    var source = vis.analysis.findNodeById('a0');
    this.dataviewModel = vis.dataviews.createHistogramModel({
      id: 'abc-123',
      title: 'my histogram',
      column: 'a_column',
      bins: 20,
      source: source
    });

    this.dataviewModel.set('data', [{
      name: 'foo'
    }, {
      name: 'bar'
    }]);

    var cartocss = '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74"), ("soccer", "basketball", "baseball", "handball", "hockey"));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}';
    this.layer.set({
      cartocss: cartocss,
      initialStyle: cartocss
    });
    spyOn(this.dataviewModel, 'getDistributionType').and.returnValue('J');

    this.widgetModel = new HistogramWidgetModel({
      type: 'histogram'
    }, {
      dataviewModel: this.dataviewModel,
      layerModel: this.layer
    }, {autoStyleEnabled: true});

    this.view = new HistogramTitleView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel,
      layerModel: this.layer
    });
  });

  it('should render properly', function () {
    this.view.render();
    var $el = this.view.$el;
    expect($el.find('.CDB-Widget-options').length).toBe(1);
    expect($el.find('h3').length).toBe(1);
  });

  describe('with autoStyleEnabled as true', function () {
    describe('options', function () {
      beforeEach(function () {
        spyOn(this.view, '_isAutoStyleButtonVisible').and.returnValue(true);
        this.view.render();
      });

      it('should render "apply colors" button and apply them when is clicked', function () {
        expect(this.view.$('.js-autoStyle').length).toBe(1);
        spyOn(this.widgetModel, 'autoStyle').and.callThrough();
        this.view.$('.js-autoStyle').click();
        expect(this.widgetModel.autoStyle).toHaveBeenCalled();
        expect(this.view.$('.js-autoStyle').length).toBe(0);
        expect(this.view.$('.js-cancelAutoStyle').length).toBe(1);
      });

      it('should remove histogram colors when they are applied and button is clicked', function () {
        spyOn(this.widgetModel, 'cancelAutoStyle').and.callThrough();
        this.view.$('.js-autoStyle').click();
        expect(this.view.$('.js-cancelAutoStyle').hasClass('is-selected')).toBeTruthy();
        this.view.$('.js-cancelAutoStyle').click();
        expect(this.widgetModel.cancelAutoStyle).toHaveBeenCalled();
      });
    });

    describe('autostyle', function () {
      beforeEach(function () {
        this.layer.set('cartocss', '#whatever {}');
      });

      describe('checking allowed', function () {
        beforeEach(function () {
          spyOn(this.widgetModel, 'hasColorsAutoStyle').and.returnValue(true);
          this.view.render();
        });

        it('should remove button when not allowed', function () {
          this.widgetModel.set('style', {auto_style: {allowed: false}});
          expect(this.view.$('.js-autoStyle').length).toBe(0);
        });

        it('should show button when allowed', function () {
          this.widgetModel.set('style', {auto_style: {allowed: true}});
          expect(this.view.$('.js-autoStyle').length).toBe(1);
        });
      });

      describe('checking layer visibility', function () {
        beforeEach(function () {
          spyOn(this.widgetModel, 'getAutoStyle').and.returnValue({
            cartocss: '#whatever {}',
            definition: 'dummy'
          });
          this.view.render();
        });

        it('should not render the autostyle button if layer is hidden', function () {
          this.layer.set({visible: false});
          expect(this.view.$('.js-autoStyle').length).toBe(0);
        });
      });

      describe('checking auto-style definition', function () {
        it('should display autostyle button if definition exists', function () {
          spyOn(this.widgetModel, 'hasColorsAutoStyle').and.returnValue(true);
          this.view.render();
          expect(this.view.$('.js-autoStyle').length).toBe(1);
        });

        it('should not display autostyle button if definition doesn\'t exist', function () {
          spyOn(this.widgetModel, 'hasColorsAutoStyle').and.returnValue(false);
          this.view.render();
          expect(this.view.$('.js-autoStyle').length).toBe(0);
        });
      });
    });
  });

  describe('with autoStyleEnabled set to false', function () {
    beforeEach(function () {
      var widgetModel = new HistogramWidgetModel({
        type: 'histogram'
      }, {
        dataviewModel: this.dataviewModel,
        layerModel: this.layer
      }, {autoStyleEnabled: false});

      spyOn(widgetModel, 'getAutoStyle').and.returnValue({
        cartocss: '#whatever {}',
        definition: {
          point: {
            fill: {
              color: 'red'
            }
          }
        }
      });

      this.view = new HistogramTitleView({
        widgetModel: widgetModel,
        dataviewModel: this.dataviewModel,
        layerModel: this.layer
      });

      this.view.render();
    });

    it('should not render the autostyle button', function () {
      expect(this.view.$('.js-autoStyle').length).toBe(0);
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
