var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
// var PopupManager = require('builder/components/popup-manager');

// var InputSizeFixedContentView = require('./input-size-fixed-content-view');
// var InputSizeValueContentView = require('./input-size-value-content-view');

// var DEFAULT_INPUT_MIN_VALUE = 0;
// var DEFAULT_INPUT_MAX_VALUE = 100;
// var DEFAULT_INPUT_STEP_VALUE = 1;

var template = require('./size.tpl');

// WIP
Backbone.Form.editors.Size = Backbone.Form.editors.Base.extend({

  // tagName: 'ul',
  // className: '',

  events: {
    'change input[type=radio][name=sizeOption]': '_renderSelectedType',
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts); // Options

    this.options = _.extend(
      this.options,
      {
        columns: this.options.options,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        editorAttrs: this.options.editorAttrs,
        modals: this.options.modals
      }
    );

    this._keyAttr = opts.key;
    this.value = this.model.get(opts.key);

    // this.dialogMode = this.options.dialogMode || 'nested';

    // this._initBinds();
    this._initViews();

    // this._popupManager = new PopupManager(this.cid, this.$el, this._fillDialogView.$el);
  },
  /*
  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },
  */

  _initBinds: function () {
    // TODO
  },

  _initViews: function () {
    // TODO
    this.$el.html(template());

    this._renderSelectedType();
    // this._initInputFields();
    // this._hideUnusedTypeIfNeeded();
  },

  _renderSelectedType: function () {
    var selected = (this._getSelectedType() === 'fixed') ? this._generateFixedContentView() : this._generateValueContentView();
    this.$('.js-content').html(selected.render());
  },

  _hideUnusedTypeIfNeeded: function () {
    // something like...
    /*
    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      var hidePanes = this.options.editorAttrs.hidePanes;
      if (!_.contains(hidePanes, 'fixed')) {
        this._tabPaneTabs.push(fixedPane);
      }
    }
    */
  },

  _getSelectedType: function () {
    var type = this.$('input[type=radio]:checked').val();
    return (type === '') ? null : type;
  },

  _generateFixedContentView: function () {
    var v = new (Backbone.View.extend({render: function () {
      return '<span class="CDB-Text u-upperCase CDB-FontSize-small">Fixed content</span>';
    }}))();
    return v;
    // var editorAttrs = this.options.editorAttrs;
    // return new InputSizeFixedContentView({
    //   model: this.model,
    //   min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
    //   max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE,
    //   step: (editorAttrs && editorAttrs.step) || DEFAULT_INPUT_STEP_VALUE
    // });
  },

  _generateValueContentView: function () {
    var v = new (Backbone.View.extend({render: function () {
      return '<span class="CDB-Text u-upperCase CDB-FontSize-small">By Value content</span>';
    }}))();
    return v;
    // var editorAttrs = this.options.editorAttrs;
    // return new InputSizeValueContentView({
    //   model: this.model,
    //   columns: this._columns,
    //   min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
    //   max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE
    // });
  },

  focus: function () {
    // TODO
  },

  blur: function () {
    // TODO
  },

  getValue: function () {
    // TODO
    return this.value;
  },

  setValue: function (value) {
    // TODO
    // this.value = value;
  },

  remove: function () {
    // TODO
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
