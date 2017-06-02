var cdb = require('cartodb.js');
var WidgetLoaderView = require('../../src/widgets/widget-loader-view');

describe('widgets/widget-loader-view', function () {
  beforeEach(function () {
    this.dataviewModel = new cdb.core.Model();
    this.view = new WidgetLoaderView({
      model: this.dataviewModel
    });
  });

  it('should have render correctly', function () {
    expect(this.view.render()).toBe(this.view);
    expect(this.view.$el.hasClass('CDB-Widget-loader')).toBeTruthy();
  });

  describe('when loading', function () {
    beforeEach(function () {
      jasmine.clock().install();
      this.view.render();
      this.dataviewModel.trigger('loading');
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should show the view', function () {
      expect(this.view.$('.js-loader').hasClass('is-visible')).toBe(true);
    });

    describe('when syncing', function () {
      beforeEach(function () {
        this.dataviewModel.trigger('loaded');
      });

      it('should hide the view', function () {
        expect(this.view.$('.js-loader').hasClass('is-visible')).toBe(true);
        jasmine.clock().tick(2000);
        expect(this.view.$('.js-loader').hasClass('is-visible')).toBe(false);
      });
    });

    describe('when datavieModel throws an error', function () {
      it('should hide the view', function () {
        this.dataviewModel.trigger('error');
        expect(this.view.$('.js-loader').hasClass('is-visible')).toBe(true);
        jasmine.clock().tick(2000);
        expect(this.view.$('.js-loader').hasClass('is-visible')).toBe(false);
      });

      it('should not hide the view if it is due to an abort', function () {
        this.dataviewModel.trigger('error', this.datavieModel, { statusText: 'abort' });
        jasmine.clock().tick(2000);
        expect(this.view.$('.js-loader').hasClass('is-visible')).toBe(true);
      });
    });
  });
});
