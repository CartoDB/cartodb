var cdb = require('cartodb.js');
var PanelWithOptions = require('../../../../../../javascripts/cartodb3/editor/components/view-options/panel-with-options-view.js');

describe('editor/components/view-options/panel-with-options-view', function () {
  beforeEach(function () {
    var Dummy = cdb.core.View.extend({
      render: function () {
        this.$el.html(this.options.content);
        return this;
      }
    });

    this.view = new PanelWithOptions({
      editorModel: new cdb.core.Model(),
      createContentView: function () {
        return new Dummy({
          content: 'Content'
        });
      },
      createControlView: function () {
        return new Dummy({
          content: 'Toogle'
        });
      },
      createActionView: function () {
        return new Dummy({
          content: 'Undo'
        });
      }
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-content').length).toBe(1);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should switch views properly', function () {
    expect(this.view.$('.js-content').html()).toContain('Content');
    expect(this.view.$('.js-actions').html()).toContain('Undo');
    expect(this.view.$('.js-controls').html()).toContain('Toogle');
  });

  afterEach(function () {
    this.view.clean();
  });
});
