var Toggler = require('../../../../../../javascripts/cartodb3/editor/components/toggler/toggler-view.js');
var TabPaneCollection = require('../../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');

describe('editor/components/toggler/toggler', function () {
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

  var collection = new TabPaneCollection(panes);

  beforeEach(function () {
    this.view = new Toggler({
      collection: collection
    });
    spyOn(this.view, 'render');
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-input').prop('checked')).toBe(false);
    expect(this.view.$('label').length).toBe(2);
  });

  it('should re render on change collection', function () {
    collection.at(1).set({selected: true});
    expect(this.view.render).toHaveBeenCalled();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
