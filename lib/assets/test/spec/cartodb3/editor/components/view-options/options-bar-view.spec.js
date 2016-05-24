var PanelWithOptionsView = require('../../../../../../javascripts/cartodb3/editor/components/view-options/panel-with-options-view.js');
var TabPaneCollection = require('../../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');

describe('editor/components/view-options/panel-with-options-view', function () {
  var Dummy = cdb.core.View.extend({
    render: function () {
      this.$el.html(this.options.content);
      return this;
    }
  });

  var panes = [{
    label: 'foo',
    selected: true,
    createContentView: function () {
      return new Dummy({
        content: 'foo'
      });
    },
    createControlView: function () {
      return new Dummy({
        content: 'Button'
      });
    }
  }, {
    label: 'bar',
    selected: false,
    createContentView: function () {
      return new Dummy({
        content: 'bar'
      });
    },
    createControlView: function () {
      return new Dummy({
        content: 'Undo'
      });
    }
  }];

  var collection = new TabPaneCollection(panes);

  beforeEach(function () {
    this.view = new PanelWithOptionsView({
      collection: collection
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-control').length).toBe(1);
    expect(this.view.$('.js-actions').length).toBe(1);
  });

  it('should render subview properly', function () {
    expect(this.view.$('.js-actions').html()).toContain('Button');
    collection.at(1).set({selected: true});
    collection.trigger('toggle');
    expect(this.view.$('.js-actions').html()).toContain('Undo');
  });

  afterEach(function () {
    this.view.clean();
  });
});
