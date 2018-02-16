var $ = require('jquery');
var NASAView = require('builder/components/modals/add-basemap/nasa/nasa-view');
var NASAModel = require('builder/components/modals/add-basemap/nasa/nasa-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var ConfigModel = require('builder/data/config-model');

describe('components/modals/add-basemap/nasa/nasa-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/2016-09-20/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg',
        category: 'NASA',
        className: 'httpmap1visearthdatanasagovwmtswebmercmodis_terra_correctedreflectance_truecolordefault20160920googlemapscompatible_level9zyxjpeg'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new NASAModel(null, {
      customBaselayersCollection: this.customBaselayersCollection
    });

    var submitButton = $('<button class="is-disabled">Submit</button>');

    this.view = new NASAView({
      model: this.model,
      submitButton: submitButton
    });
    this.view.render();
  });

  it('should render day option as pre-selected', function () {
    expect(this.view.$('.js-day .RadioButton-input').hasClass('is-checked')).toBeTruthy();
  });

  it('should show date picker', function () {
    expect(this.view.$('.DatePicker').length).toBe(1);
  });

  it('should render date of yesterday as start date', function () {
    expect(this.innerHTML()).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  describe('when changing from day to night', function () {
    beforeEach(function () {
      this.view.$('.js-night').click();
    });

    it('should disable date picker', function () {
      expect(this.view.$('.DatePicker .DatePicker-dates').hasClass('is-disabled')).toBeTruthy();
    });

    describe('when changing back to day', function () {
      beforeEach(function () {
        this.view.$('.js-day').click();
      });

      it('should enable date picker again', function () {
        expect(this.view.$('.DatePicker .DatePicker-dates').hasClass('is-disabled')).toBeFalsy();
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
