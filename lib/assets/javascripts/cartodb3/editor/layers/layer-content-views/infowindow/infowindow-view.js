var cdb = require('cartodb.js');
var EditionTogglePanelView = require('../../../../components/edition-toggle/edition-toggle-panel-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');
var InfowindowContentView = require('./infowindow-content-view');

module.exports = cdb.core.View.extend({
  render: function () {
    var self = this;

    // CodeMirror placeholder
    var CodeMirrorModel = new cdb.core.Model({
      content: 'Hola mundo'
    });

    var tabPaneTabs = [{
      label: self.options.toggleLabels.off,
      selected: true,
      createContentView: function () {
        return new InfowindowContentView(self.options);
      }
    }, {
      label: self.options.toggleLabels.on,
      selected: false,
      createContentView: function () {
        return new CodeMirrorView({
          model: CodeMirrorModel
        });
      }
    }];

    var editionTogglePanelView = new EditionTogglePanelView({
      panes: tabPaneTabs,
      controlsView: self.options.controlsView
    });

    this.$el.append(editionTogglePanelView.render().el);
    this.addView(editionTogglePanelView);

    return this;
  }
});
