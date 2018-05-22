var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/helpers/editor');

var StrokeColorView = require('builder/components/form-components/editors/stroke-color/stroke-color-view');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

Backbone.Form.editors.StrokeColor = Backbone.Form.editors.Base.extend({
  className: 'Form-InputStrokeColor',

  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    if (this.options.editorAttrs) {
      this.options = _.extend(this.options, {
        columns: this.options.options,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        editorAttrs: this.options.editorAttrs,
        modals: this.options.modals
      });
    }

    this._strokeColorModel = new Backbone.Model(this.model.get('strokeColor'));

    this._initViews();
  },

  _initViews: function () {
    this._strokeColorView = new StrokeColorView({
      model: this.model,
      strokeColorModel: this._strokeColorModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      editorAttrs: this.options.editorAttrs,
      modals: this.options.modals,
      dialogMode: DialogConstants.Mode.FLOAT,
      popupConfig: {
        cid: this.cid,
        $el: this.$el
      }
    });

    this.applyESCBind(this._removeStrokeColorDialog);
    this.applyClickOutsideBind(this._removeStrokeColorDialog);

    this._strokeColorView.on('onInputChanged', function (input) {
      this.trigger('change', input);
    }, this);

    this.$el.append(this._strokeColorView.render().$el);
  },

  _removeStrokeColorDialog: function () {
    this._strokeColorView.removeDialog();
  },

  getValue: function (param) {
    var colorOmitAttributes = [
      'createContentView',
      'selected',
      'type'
    ];

    var values = _.omit(this._strokeColorModel.toJSON(), colorOmitAttributes);

    this._strokeColorModel.set(values);

    return values;
  }
});
