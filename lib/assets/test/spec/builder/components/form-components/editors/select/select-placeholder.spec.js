var Backbone = require('backbone');
var _ = require('underscore');

describe('components/form-components/editors/select', function () {
  var view;

  var mouseOverAction;
  var mouseOutAction;

  mouseOverAction = jasmine.createSpy('mouseOverAction');
  mouseOutAction = jasmine.createSpy('mouseOutAction');

  var createViewFn = function (options) {
    var model = new Backbone.Model({
      names: 'pepe',
      latitude: undefined
    });

    var defaultOptions = {
      key: 'names',
      schema: {
        options: ['pepe', 'paco', 'juan']
      },
      model: model,
      mouseOverAction: mouseOverAction,
      mouseOutAction: mouseOutAction,
      placeholder: 'gruntbuggly'
    };

    view = new Backbone.Form.editors.SelectPlaceholder(_.extend(defaultOptions, options));

    view.render();

    return view;
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  afterEach(function () {
    view && view.remove();
  });

  it('should force is-empty if provided forcePlaceholder', function () {
    view = this.createView({
      forcePlaceholder: true
    });

    var btn = view.$el.find('.js-button');

    expect(btn.hasClass('is-empty')).toBe(true);
    expect(btn.text()).toContain('gruntbuggly');
  });

  it('should force is-empty if provided forcePlaceholder', function () {
    view = this.createView({
      forcePlaceholder: false
    });

    var btn = view.$el.find('.js-button');

    expect(btn.hasClass('is-empty')).toBe(false);
    expect(btn.text()).not.toContain('gruntbuggly');
    expect(btn.text()).toContain('pepe');
  });
});
