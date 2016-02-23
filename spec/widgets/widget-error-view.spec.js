var cdb = require('cartodb.js');
var WidgetErrorView = require('../../src/widgets/widget-error-view');

describe('widgets/widget-error-view', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.dataviewModel = new cdb.core.Model();
    this.dataviewModel.refresh = jasmine.createSpy('refresh');
    this.view = new WidgetErrorView({
      model: this.dataviewModel
    });
    this.renderResult = this.view.render();
  });

  it('should have render error', function () {
    expect(this.renderResult).toBe(this.view);
    expect(this.view.$el.hasClass('CDB-Widget-error')).toBeTruthy();
    expect(this.view.$el.html()).toContain('button');
  });

  describe('when click refresh', function () {
    beforeEach(function () {
      this.view.show();
      jasmine.clock().tick(800);
      this.view.$('.js-refresh').click();
    });

    it('should call refresh on dataviewModel', function () {
      expect(this.dataviewModel.refresh).toHaveBeenCalled();
    });
  });

  describe('when error is triggered', function () {
    it('should show view', function () {
      this.dataviewModel.trigger('error');
      expect(this.view.$el.hasClass('is-hidden')).toBe(false);
    });

    it('should not show view if errors come from a cancelled request', function () {
      this.dataviewModel.trigger('error', this.datavieModel, { statusText: 'abort' });
      expect(this.view.$el.hasClass('is-hidden')).toBe(true);
    });
  });

  describe('when loading is triggered', function () {
    beforeEach(function () {
      this.dataviewModel.trigger('loading');
    });

    it('should hide view', function () {
      expect(this.view.$el.hasClass('is-hidden')).toBe(true);
    });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });
});
