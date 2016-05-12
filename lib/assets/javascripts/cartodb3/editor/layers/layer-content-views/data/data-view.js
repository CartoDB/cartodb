var cdb = require('cartodb.js');
var EditionTogglePanelView = require('../../../../components/edition-toggle/edition-toggle-panel-view');

module.exports = cdb.core.View.extend({
  render: function () {
    var Dummy = cdb.core.View.extend({
      render: function () {
        this.$el.html(this.options.content);
        return this;
      }
    });

    var tabPaneTabs = [{
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

    var controlsView = new Dummy({
      content: 'Other controls here'
    });

    var editionTogglePanelView = new EditionTogglePanelView({
      collection: tabPaneTabs,
      controlsView: controlsView
    });

    this.$el.append(editionTogglePanelView.render().el);
    this.addView(editionTogglePanelView);

    return this;
  }
});
