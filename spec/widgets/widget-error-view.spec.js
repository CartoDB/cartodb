var cdb = require('cartodb.js');
var WidgetErrorView = require('../../src/widgets/widget-error-view');

describe('widgets/widget-error-view', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.dataviewModel = new cdb.core.Model({
      type: 'category'
    });
    this.error = {
      type: 'limit',
      level: 'error',
      title: 'error',
      message: 'Something went wrong',
      refresh: true
    };
    this.dataviewModel.refresh = jasmine.createSpy('refresh');
    this.view = new WidgetErrorView({
      model: this.dataviewModel,
      error: this.error,
      placeholder: function () {
        return '<p>Placeholder</p>';
      }
    });
    this.renderResult = this.view.render();
  });

  it('should have render error', function () {
    expect(this.renderResult).toBe(this.view);
    expect(this.view.$el.html()).toContain('Something went wrong');
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

  afterEach(function () {
    jasmine.clock().uninstall();
  });
});
