var WidgetModel = require('../../../src/widgets/widget-model');
var WidgetErrorView = require('../../../src/widgets/standard/widget-error-view');

describe('widgets/standard/widget-error-view', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.model = new WidgetModel({
      id: 'widget_98334',
      title: 'Helloooo',
      columns: ['cartodb_id', 'title']
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new WidgetErrorView({
      model: this.model
    });
  });

  it('should have render correctly', function () {
    this.view.render();
    expect(this.view.$el.hasClass('CDB-Widget-error')).toBeTruthy();
  });

  it('should have a binds from the beginning', function () {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('error');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('loading');
  });

  it('should fetch again the data when refresh button is clicked', function () {
    spyOn(this.model, 'fetch');
    this.view.render();
    this.view.show();
    jasmine.clock().tick(400);
    this.view.$('.js-refresh').click();
    expect(this.model.fetch).toHaveBeenCalled();
  });

  describe('visibility', function () {
    beforeEach(function () {
      this.view.render();
    });

    it("should remove is-visible class when element isn't showed", function () {
      this.view.hide();
      expect(this.view.$el.hasClass('is-hidden')).toBeTruthy();
    });

    it('should add is-visible class when element is showed', function () {
      this.view.show();
      expect(this.view.$el.hasClass('is-hidden')).toBeFalsy();
    });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });
});
