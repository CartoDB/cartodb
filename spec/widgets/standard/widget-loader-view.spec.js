var cdb = require('cartodb.js');
var WidgetLoaderView = require('../../../src/widgets/standard/widget-loader-view');

describe('widgets/standard/widget-loader-view', function () {
  beforeEach(function () {
    this.dataviewModel = new cdb.core.Model();
    this.view = new WidgetLoaderView({
      model: this.dataviewModel
    });
  });

  it('should have render correctly', function () {
    expect(this.view.render()).toBe(this.view);
    expect(this.view.$el.hasClass('CDB-Loader')).toBeTruthy();
  });

  describe('when loading', function () {
    beforeEach(function () {
      jasmine.clock().install();
      this.dataviewModel.trigger('loading');
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should show the view', function () {
      expect(this.view.$el.hasClass('is-visible')).toBe(true);
    });

    describe('when syncing', function () {
      beforeEach(function () {
        this.dataviewModel.trigger('sync');
      });

      it('should hide the view', function () {
        expect(this.view.$el.hasClass('is-visible')).toBe(true);
        jasmine.clock().tick(2000);
        expect(this.view.$el.hasClass('is-visible')).toBe(false);
      });
    });

    describe('when datavieModel throws an error', function () {
      beforeEach(function () {
        this.dataviewModel.trigger('error');
      });

      it('should hide the view', function () {
        expect(this.view.$el.hasClass('is-visible')).toBe(true);
        jasmine.clock().tick(2000);
        expect(this.view.$el.hasClass('is-visible')).toBe(false);
      });
    });
  });
});
