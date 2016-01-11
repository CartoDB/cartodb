var cdb = require('cartodb.js');
var WidgetModel = require('../../../src/widgets/widget-model');
var WidgetErrorView = require('../../../src/widgets/standard/widget-error-view');

describe('widgets/standard/widget-error-view', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.dataviewModel = new cdb.core.Model();
    this.dataviewModel.refresh = jasmine.createSpy('refresh');
    this.model = new WidgetModel({
      id: 'widget_98334',
      title: 'Helloooo',
      columns: ['cartodb_id', 'title']
    }, {
      dataviewModel: this.dataviewModel
    });

    this.view = new WidgetErrorView({
      model: this.model
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
      jasmine.clock().tick(400);
      this.view.$('.js-refresh').click();
    });

    it('should call refresh on dataviewModel', function () {
      expect(this.dataviewModel.refresh).toHaveBeenCalled();
    });
  });

  describe('when error is triggered', function () {
    beforeEach(function () {
      this.dataviewModel.trigger('error');
    });

    it('should show view', function () {
      expect(this.view.$el.hasClass('is-hidden')).toBe(false);
    });

    describe('when loading is triggered', function () {
      beforeEach(function () {
        this.dataviewModel.trigger('loading');
      });

      it('should hide view', function () {
        expect(this.view.$el.hasClass('is-hidden')).toBe(true);
      });
    });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });
});
