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
    expect(this.view.$el.hasClass('is-selected')).toBeTruthy();
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
});
