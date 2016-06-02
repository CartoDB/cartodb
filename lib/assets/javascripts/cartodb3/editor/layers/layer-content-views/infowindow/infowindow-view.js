var cdb = require('cartodb.js');
var _ = require('underscore');
var PanelWithOptionsView = require('../../../../editor/components/view-options/panel-with-options-view');
var CodeMirrorView = require('../../../../editor/components/code-mirror/code-mirror-view');
var InfowindowContentView = require('./infowindow-content-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var TabPaneView = require('../../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../../../editor/components/toggler/toggler-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._editorModel = opts.editorModel;

    this._initBinds();
    this._initTemplates();
  },

  _initBinds: function () {
    this.model.bind('change', this._onChange.bind(this), this.model);
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
      selected: true,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new InfowindowContentView(_.extend(self.options, { templates: self._templates }));
          }
        });
      }
    }, {
      selected: false,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new CodeMirrorView({
              model: CodeMirrorModel
            });
          }
        });
      }
    }];

    var collectionPane = new TabPaneCollection(tabPaneTabs);

    var panelWithOptionsView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      createContentView: function () {
        return new TabPaneView({
          collection: collectionPane
        });
      },
      createControlView: function () {
        return new Toggler({
          editorModel: self._editorModel,
          collection: collectionPane,
          labels: ['VALUES', 'HTML']
        });
      },
      createActionView: function () {
        return new Dummy({
          content: ''
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);

    return this;
  },

  clean: function () {
    this.model.unbind('change', null, this.model);
    cdb.core.View.prototype.clean.apply(this);
  }
});
