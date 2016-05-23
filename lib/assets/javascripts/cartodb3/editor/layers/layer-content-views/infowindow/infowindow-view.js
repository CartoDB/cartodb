var cdb = require('cartodb.js');
var EditionTogglePanelView = require('../../../../editor/components/edition-toggle/edition-toggle-panel-view');
var CodeMirrorView = require('../../../../editor/components/code-mirror/code-mirror-view');
var InfowindowView = require('./infowindow-content-view');
var ScrollView = require('../../../../components/scroll/scroll-view');

module.exports = cdb.core.View.extend({
  render: function () {
    this.clearSubViews();

    var self = this;

    // CodeMirror placeholder
    var CodeMirrorModel = new cdb.core.Model({
      content: 'Hola mundo'
    });

    var Dummy = cdb.core.View.extend({
      render: function () {
        this.$el.html(this.options.content);
        return this;
      }
    });

    var tabPaneTabs = [{
      label: self.options.toggleLabels.off,
      selected: true,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new InfowindowView(self.options);
          }
        });
      },
      createControlView: function () {
        return new Dummy({
          content: 'Button'
        });
      }
    }, {
      label: self.options.toggleLabels.on,
      selected: false,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new CodeMirrorView({
              model: CodeMirrorModel
            });
          }
        });
      },
      createControlView: function () {
        return new Dummy({
          content: 'Undo'
        });
      }
    }];

    var editionTogglePanelView = new EditionTogglePanelView({
      className: 'Editor-content',
      panes: tabPaneTabs
    });

    this.$el.append(editionTogglePanelView.render().el);
    this.addView(editionTogglePanelView);

    return this;
  }
});
