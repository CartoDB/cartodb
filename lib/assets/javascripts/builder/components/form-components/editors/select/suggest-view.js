var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var _ = require('underscore');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var template = require('./select.tpl');

Backbone.Form.editors.Suggest = Backbone.Form.editors.Select.extend({

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.template = opts.template || template;
    this.dialogMode = this.options.dialogMode || 'nested';
    this._setupCollection();
    this._initViews();

    this.setValue(this.model.get(this.options.keyAttr));

    this._initBinds();
  },

  _setupCollection: function () {
    var item = { label: this.value, val: this.value };
    this.collection = new CustomListCollection(this.options.options);

    if (this.options.editorAttrs && this.options.editorAttrs.collectionData) {
      var categories = _.map(this.options.editorAttrs.collectionData, function (data) {
        return { label: data, val: data };
      });

      this.collection.reset(categories);
    }

    if (this.value && !this.collection.findWhere(item)) {
      this.collection.add(item);
    }
  },

  _initBinds: function () {
    var hide = function () {
      this._listView.hide();
      this._popupManager.untrack();
    }.bind(this);

    this.collection.bind('change:selected', this._onItemSelected, this);
    this.collection.bind('reset', this.render, this);
    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);
  },

  _renderButton: function (model) {
    var button = this.$('.js-button');
    var name = model.getName();
    var isNull = name === null || name === 'null';
    var label = isNull ? 'null' : name;

    var data = _.extend({}, model.attributes, { label: label });
    var $html = this.options.selectedItemTemplate(data);

    button
      .html($html)
      .toggleClass('is-empty', isNull);

    return button;
  }

});
