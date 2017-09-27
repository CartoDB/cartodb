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

  it('should add a class with the error level', function () {
    expect(this.view.$el.hasClass('CDB-Widget--error')).toBe(true);
    this.error.level = 'warning';
    this.view.render();
    expect(this.view.$el.hasClass('CDB-Widget--error')).toBe(false);
    expect(this.view.$el.hasClass('CDB-Widget--warning')).toBe(true);
  });

  describe('when error is available', function () {
    it('should render the error', function () {
      expect(this.renderResult).toBe(this.view);
      expect(this.view.$el.html()).toContain('Something went wrong');
    });

    describe('refresh button', function () {
      it('should render only if the error allows it', function () {
        expect(this.view.$('.js-refresh').length).toEqual(1);
        this.error.refresh = false;
        this.view.render();
        expect(this.view.$('.js-refresh').length).toEqual(0);
      });

      it('should call refresh on dataviewModel', function () {
        jasmine.clock().tick(800);
        this.view.$('.js-refresh').click();
        expect(this.dataviewModel.refresh).toHaveBeenCalled();
      });
    });

    describe('placeholder', function () {
      it('should render only if the error does not have a refresh button', function () {
        expect(this.view.$el.html()).not.toContain('Placeholder');
        this.error.refresh = false;
        this.view.render();
        expect(this.view.$el.html()).toContain('Placeholder');
      });
    });
  });

  describe('when error is not available', function () {
    beforeEach(function () {
      this.error.type = null;
      this.view.render();
    });

    it('should not render any text', function () {
      expect(this.view.$('.CDB-Widget-title').length).toEqual(0);
    });

    describe('refresh button', function () {
      it('should always render', function () {
        expect(this.view.$('.js-refresh').length).toEqual(1);
        this.error.refresh = false;
        this.view.render();
        expect(this.view.$('.js-refresh').length).toEqual(1);
      });

      it('should call refresh on dataviewModel', function () {
        jasmine.clock().tick(800);
        this.view.$('.js-refresh').click();
        expect(this.dataviewModel.refresh).toHaveBeenCalled();
      });
    });

    describe('placeholder', function () {
      it('should always render', function () {
        expect(this.view.$el.html()).toContain('Placeholder');
        this.error.refresh = false;
        this.view.render();
        expect(this.view.$el.html()).toContain('Placeholder');
      });
    });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });
});
