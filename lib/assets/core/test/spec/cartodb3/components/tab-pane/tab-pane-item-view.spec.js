var TabPaneItemView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-item-view');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

describe('components/tab-pane-item-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      createButtonView: function () {
        return new CoreView();
      }
    });

    this.view = new TabPaneItemView({
      model: this.model
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should select the view', function () {
    this.view.$el.click();
    expect(this.view.model.get('selected')).toBeTruthy();
  });

  it('should add the selected class on the start', function () {
    var view = new TabPaneItemView({
      model: new Backbone.Model({
        selected: true,
        createButtonView: function () {
          return new CoreView();
        }
      })
    }).render();

    expect(view.$el.hasClass('is-selected')).toBeTruthy();
  });

  it('should be disabled if required, but not by default', function () {
    expect(this.view.$el.hasClass('is-disabled')).toBeFalsy();

    var model = new Backbone.Model({
      disabled: true,
      createButtonView: function () {
        return new CoreView();
      }
    });
    var view = new TabPaneItemView({ model: model }).render();

    expect(view.$el.hasClass('is-disabled')).toBeTruthy();
  });

  it('should allow the use of a tooltip', function () {
    expect(this.view.tooltip).not.toBeDefined();

    var tooltipText = 'Hi there!';
    var model = new Backbone.Model({
      tooltip: tooltipText,
      createButtonView: function () {
        return new CoreView();
      }
    });
    var view = new TabPaneItemView({ model: model }).render();

    expect(view.tooltip).toBeDefined();
    expect(view.tooltip.tipsy.options.title()).toBe(tooltipText);
  });

});
