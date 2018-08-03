var _ = require('underscore');
var TabPaneItemView = require('builder/components/tab-pane/tab-pane-item-view');
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

  it('should add the disabled class on the start if item is disabled', function () {
    var view = new TabPaneItemView({
      model: new Backbone.Model({
        disabled: true,
        createButtonView: function () {
          return new CoreView();
        }
      })
    }).render();

    expect(view.$el.hasClass('is-disabled')).toBeTruthy();
  });

  describe('with tooltip', function () {
    describe('.render', function () {
      it('should render properly', function () {
        expect(this.model.set('tooltip', 'help'));

        this.view.render();

        expect(_.size(this.view._subviews)).toBe(2);
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
