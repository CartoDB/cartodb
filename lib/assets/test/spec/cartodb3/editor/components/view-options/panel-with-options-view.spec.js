var EditionTogglerPanelView = require('../../../../../../javascripts/cartodb3/editor/components/view-options/panel-with-options-view.js');

describe('editor/components/view-options/panel-with-options-view', function () {
  beforeEach(function () {
    var Dummy = cdb.core.View.extend({
      render: function () {
        this.$el.html(this.options.content);
        return this;
      }
    });

    this.collection = [{
      label: 'foo',
      selected: true,
      createContentView: function () {
        return new Dummy({
          content: 'foo'
        });
      }
    }, {
      label: 'bar',
      selected: false,
      createContentView: function () {
        return new Dummy({
          content: 'bar'
        });
      }
    }];

    this.view = new EditionTogglerPanelView({
      panes: this.collection
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-content').length).toBe(1);
  });

  it('should switch views properly', function () {
    expect(this.view.$('.js-content').html()).toContain('foo');
    this.view.collection.at(1).set({selected: true});
    expect(this.view.$('.js-content').html()).not.toContain('foo');
    expect(this.view.$('.js-content').html()).toContain('bar');
  });

  afterEach(function () {
    this.view.clean();
  });
});
