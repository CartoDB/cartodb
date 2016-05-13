var cdb = require('cartodb.js');
var EditionTogglePanelView = require('../../../../components/edition-toggle/edition-toggle-panel-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');

module.exports = cdb.core.View.extend({
  className: 'u-flex-full-height',
  render: function () {
    var Dummy = cdb.core.View.extend({
      className: 'u-flex-full-height',
      render: function () {
        this.$el.html(this.options.content);
        return this;
      }
    });

    var CodeMirrorModel = new cdb.core.Model({
      content: 'Hola mundo'
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
      label: 'code',
      selected: false,
      createContentView: function () {
        return new CodeMirrorView({
          className: 'u-flex-full-height',
          model: CodeMirrorModel
        });
      }
    }];

    var controlsView = new Dummy({
      content: 'Other controls here'
    });

    var editionTogglePanelView = new EditionTogglePanelView({
      className: 'u-flex-full-height',
      collection: tabPaneTabs,
      controlsView: controlsView
    });

    this.$el.append(editionTogglePanelView.render().el);
    this.addView(editionTogglePanelView);

    return this;
  }
});
