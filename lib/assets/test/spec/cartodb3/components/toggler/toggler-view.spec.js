var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var Toggler = require('../../../../../javascripts/cartodb3/components/toggler/toggler-view.js');
var TabPaneCollection = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');

describe('components/toggler/toggler', function () {
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
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-input').prop('checked')).toBe(false);
    expect(this.view.$('label').length).toBe(2);
  });

  describe('change value', function () {
    beforeEach(function () {
      this.onChanged = jasmine.createSpy('onChanged');
      this.view.bind('change', this.onChanged);
    });

    it('should trigger change', function () {
      this.view.$('.js-input').get(0).click();
      expect(this.onChanged).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
