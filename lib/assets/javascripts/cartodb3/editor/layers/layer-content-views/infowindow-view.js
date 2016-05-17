var cdb = require('cartodb.js');
var EditionTogglePanelView = require('../../../components/edition-toggle/edition-toggle-panel-view');
var CodeMirrorView = require('../../../components/code-mirror/code-mirror-view');
var InfowindowView = require('./infowindow/infowindow-view');

module.exports = cdb.core.View.extend({
  render: function () {
    var self = this;

    // CodeMirror placeholder
    var CodeMirrorModel = new cdb.core.Model({
      content: 'Hola mundo'
    });

    var tabPaneTabs = [{
      label: 'VALUES',
      selected: true,
      createContentView: function () {
        return new InfowindowView(self.options);
      }
    }, {
      label: 'HTML',
      selected: false,
      createContentView: function () {
        return new CodeMirrorView({
          model: CodeMirrorModel
        });
      }
    }];

    var editionTogglePanelView = new EditionTogglePanelView({
      panes: tabPaneTabs
    });

    this.$el.append(editionTogglePanelView.render().el);
    this.addView(editionTogglePanelView);

    return this;
  }
});
