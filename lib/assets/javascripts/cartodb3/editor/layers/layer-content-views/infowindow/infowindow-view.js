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
var ApplyView = require('./infowindow-apply-button-view');

var cdb = require('cartodb.js');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._editorModel = opts.editorModel;

    this._codemirrorModel = new Backbone.Model({
      content: this._getTemplateContent()
    });

    this._initBinds();
    this._configPanes();
    this._initTemplates();
  },

  _setContent: function () {
    var html_value = this._getTemplateContent();
    this._codemirrorModel.set({
      content: html_value,
      errors: []
    });
  },

  _initBinds: function () {
    this.model.bind('change', this._onChange.bind(this), this.model);

    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);
  },

  _saveInfowindowHTML: function () {
    var content = this._codemirrorModel.get('content');
    // Parse
    var errors = this._getErrors(content);

    if (errors.length === 0) {
      this._layerDefinitionModel.save();

      // Save old fields
      if (!this.model.get('old_fields')) {
        this.model.saveFields();
      }

      // Save old template name
      if (!this.model.get('old_template_name')) {
        this.model.set('old_template_name', this.model.get('template_name'));
      }

      // Set all fields + new custom template
      this.model.set({
        template: this._codemirrorModel.get('content'),
        template_name: ''
      }, {silent: true});
    } else {
      this._parseErrors(errors);
    }
  },

  _getErrors: function (content) {
    try {
      var template = new cdb.core.Template({
        template: content,
        type: 'mustache'
      });
      template.compile()();
      if (content === '') {
        return [{
          line: 1,
          message: 'Template is empty'
        }];
      } else {
        return [];
      }
    } catch (e) {
      return e;
    }
  },

  _parseErrors: function (errors) {
    console.log(errors);
  },

  _clearErrors: function () {
    this._codemirrorModel.set({errors: []});
  },

  _getTemplateContent: function () {
    // Clone fields
    var fields = [];
    var alternative_names = this.model.get('alternative_names');

    _.each(this.model.get('fields'), function (field, i) {
      var f = _.clone(field);
      f.position = i;
      if (alternative_names[f.name]) {
        f.alternative_name = alternative_names[f.name];
      }
      fields.push(f);
    });

    var tmpl = new cdb.core.Template({
      template: this.model.getCustomTemplate(),
      type: 'mustache'
    });

    return tmpl.render({content: { fields: fields }});
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
      },
      createActionView: function () {
        return new CoreView();
      }
    }, {
      createContentView: function () {
        return new CodeMirrorView({
          tip: _t('editor.infowindow.code-mirror.save'),
          model: self._codemirrorModel
        });
      },
      createActionView: function () {
        return new ApplyView({
          onApplyClick: self._saveInfowindowHTML.bind(self)
        });
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _onChange: function () {
    this._layerDefinitionModel.save();
    this._setContent();
  },

  _onChangeEdition: function () {
    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
  },

  render: function () {
    this.clearSubViews();

    var self = this;

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
          labels: [_t('editor.infowindow.html-toggle.values'), _t('editor.infowindow.html-toggle.html')]
        });
      },
      createActionView: function () {
        return new TabPaneView({
          collection: self._collectionPane,
          createContentKey: 'createActionView'
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
