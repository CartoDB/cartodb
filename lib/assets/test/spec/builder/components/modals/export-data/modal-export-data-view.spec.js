var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var ExportView = require('builder/components/modals/export-data/modal-export-data-view');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');

describe('components/modals/export-data/modal-export-data-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.queryGeometryModel = new Backbone.Model({
      status: 'fetched',
      simple_geom: 'point',
      query: 'select * from wadus'
    });

    this.querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    spyOn(ExportView.prototype, 'submit');

    MetricsTracker.init({
      userId: 'USER_ID',
      visId: 'VIS_ID',
      configModel: new Backbone.Model()
    });
    spyOn(MetricsTracker, 'track');

    this.modalModel = new Backbone.Model();
    this.view = new ExportView({
      configModel: this.configModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      canHideColumns: false,
      modalModel: this.modalModel,
      fromView: 'layer'
    });
    spyOn(this.view, 'fetchCSV').and.callThrough();
    spyOn(this.view, '_fetchGET');

    this.view.render();
  });

  describe('render', function () {
    it('should render properly for points', function () {
      expect(this.view.$('.Modal-listFormItem').length).toBe(6);
      expect(this.view.$('.Modal-listFormItem.is-disabled').length).toBe(0);
      expect(this.view.$('[data-format=csv]:checked').length).toBe(1);
    });

    it('should render properly for lines', function () {
      this.queryGeometryModel.set('simple_geom', 'line');
      this.view.render();

      expect(this.view.$('.Modal-listFormItem').length).toBe(6);
      expect(this.view.$('.Modal-listFormItem.is-disabled').length).toBe(0);
      expect(this.view.$('[data-format=csv]:checked').length).toBe(1);
    });

    it('should render properly for polygons', function () {
      this.queryGeometryModel.set('simple_geom', 'polygon');
      this.view.render();

      expect(this.view.$('.Modal-listFormItem').length).toBe(6);
      expect(this.view.$('.Modal-listFormItem.is-disabled').length).toBe(0);
      expect(this.view.$('[data-format=csv]:checked').length).toBe(1);
    });

    it('should render properly for no geometries', function () {
      this.queryGeometryModel.set('simple_geom', null);
      this.view.render();

      expect(this.view.$('.Modal-listFormItem').length).toBe(6);
      expect(this.view.$('.Modal-listFormItem.is-disabled').length).toBe(5);
      expect(this.view.$('[data-format=csv]:disabled').length).toBe(0);
      expect(this.view.$('[data-format=csv]:checked').length).toBe(1);
    });
  });

  describe('actions', function () {
    describe('confirm', function () {
      it('should track a metric if optional layerModel is present', function () {
        var layerModel = new Backbone.Model({
          id: 'wadus',
          source: 'd0',
          visible: true,
          table_name: 'wadus',
          visualization_id: 'wadus',
          user_id: 'wadus'
        });
        layerModel.getName = jasmine.createSpy('getName');

        // Create a new view with (optional) layerModel
        var view = new ExportView({
          layerModel: layerModel,
          configModel: this.configModel,
          queryGeometryModel: this.queryGeometryModel,
          querySchemaModel: this.querySchemaModel,
          canHideColumns: false,
          modalModel: {},
          fromView: 'layer'
        });
        spyOn(view, 'fetchCSV');
        view.render();
        view.$('.js-confirm').trigger('click');

        expect(MetricsTracker.track).toHaveBeenCalledWith(MetricsTypes.DOWNLOADED_LAYER, {
          'from_view': 'layer',
          'format': 'csv',
          'layer_id': 'wadus',
          'source': 'd0',
          'visible': true,
          'table_name': 'wadus'
        });
        expect(view.fetchCSV).toHaveBeenCalled();
        view.clean();
      });

      it('should NOT track a metric if layerModel is NOT present', function () {
        this.view.$('.js-confirm').trigger('click');

        expect(MetricsTracker.track).not.toHaveBeenCalled();
        expect(this.view.fetchCSV).toHaveBeenCalled();
      });

      it('should fetch the file', function () {
        this.view.$('.js-confirm').trigger('click');

        expect(this.view.fetchCSV).toHaveBeenCalled();
      });

      it('should always drop the_geom_webmercator', function () {
        this.view.$('.js-confirm').trigger('click');
        expect(this.view.$('.js-skipfields').val()).toContain('the_geom_webmercator');
      });

      it('should not drop the_geom for CSV files', function () {
        this.view.$('.js-confirm').trigger('click');
        expect(this.view.$('.js-skipfields').val()).toBe('the_geom_webmercator');
      });

      it('should drop the_geom for files that are not CSV', function () {
        this.view.$('.js-format[data-format="csv"]').attr('checked', null);
        this.view.$('.js-format[data-format="gpkg"]').attr('checked', true);
        this.view.$('.js-confirm').trigger('click');
        expect(this.view.$('.js-skipfields').val()).toContain('the_geom_webmercator,the_geom');
      });

      describe('if the view can hide columns', function () {
        beforeEach(function () {
          this.querySchemaModel.getColumnNames = function () { return ['center']; };
          this.view = new ExportView({
            configModel: this.configModel,
            queryGeometryModel: this.queryGeometryModel,
            querySchemaModel: this.querySchemaModel,
            canHideColumns: true,
            modalModel: {},
            fromView: 'layer'
          });
          spyOn(this.view, '_fetchGET');
          spyOn(this.view, '_close');
          this.view.render();
        });

        afterEach(function () {
          this.view.clean();
        });

        it('should not drop center columns if it is not geometry', function () {
          this.querySchemaModel.getColumnType = function () { return 'wadus'; };
          this.view.$('.js-confirm').trigger('click');
          expect(this.view.$('.js-skipfields').val()).not.toContain('center');
        });

        it('should drop center column if it is geometry-typed', function () {
          this.querySchemaModel.getColumnType = function () { return 'geometry'; };
          this.view.$('.js-confirm').trigger('click');
          expect(this.view.$('.js-skipfields').val()).toContain('center');
        });
      });
    });

    describe('cancel', function () {
      it('should destroy the model', function () {
        spyOn(this.modalModel, 'destroy');

        this.view.$('.js-cancel').trigger('click');

        expect(this.modalModel.destroy).toHaveBeenCalled();
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
