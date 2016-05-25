var cdb = require('cartodb.js');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

var EditionTogglePanelView = require('../../../../components/edition-toggle/edition-toggle-panel-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');
var InfowindowContentView = require('./infowindow-content-view');
var ScrollView = require('../../../../components/scroll/scroll-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    this._initBinds();
    this._initTemplates();
  },

  _initBinds: function () {
    this._layerInfowindowModel.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this._layerInfowindowModel);
  },

  _onChange: function () {
    this._layerDefinitionModel.save();
  },

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
            return new InfowindowContentView(_.extend(self.options, { templates: self._templates }));
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
  },

  clean: function () {
    this._layerInfowindowModel.unbind('change', null, this._layerInfowindowModel);
    cdb.core.View.prototype.clean.apply(this);
  }
});
