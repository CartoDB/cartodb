var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var PanelWithOptionsView = require('../../../../editor/components/view-options/panel-with-options-view');
var CodeMirrorView = require('../../../../editor/components/code-mirror/code-mirror-view');
var InfowindowContentView = require('./infowindow-content-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var TabPaneView = require('../../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../../../editor/components/toggler/toggler-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._editorModel = opts.editorModel;

    this._codemirrorModel = new Backbone.Model({
      content: this._layerDefinitionModel.get('cartocss')
    });

    this._initBinds();
    this._configPanes();
    this._initTemplates();
  },

  _initBinds: function () {
    this.model.bind('change', this._onChange.bind(this), this.model);

    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new InfowindowContentView(_.extend(self.options, { templates: self._templates }));
          }
        });
      }
    }, {
      createContentView: function () {
        return new CodeMirrorView({
          model: self._codemirrorModel
        });
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _onChange: function () {
    this._layerDefinitionModel.save();
  },

  _onChangeEdition: function () {
    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
  },

  render: function () {
    this.clearSubViews();

    var self = this;

    var Dummy = CoreView.extend({
      render: function () {
        this.$el.html(this.options.content);
        return this;
      }
    });

    var panelWithOptionsView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      createContentView: function () {
        return new TabPaneView({
          collection: self._collectionPane
        });
      },
      createControlView: function () {
        return new Toggler({
          editorModel: self._editorModel,
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
    CoreView.prototype.clean.apply(this);
  }

});
