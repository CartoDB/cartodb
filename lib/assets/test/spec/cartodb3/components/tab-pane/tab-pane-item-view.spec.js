var TabPaneItemView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-item-view');
var cdb = require('cartodb.js');

describe('components/tab-pane-item-view', function () {
  beforeEach(function () {
    this.model = new cdb.core.Model({
      createButtonView: function () {
        return new cdb.core.View();
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
      model: new cdb.core.Model({
        selected: true,
        createButtonView: function () {
          return new cdb.core.View();
        }
      })
    }).render();

    expect(view.$el.hasClass('is-selected')).toBeTruthy();
  });
});
