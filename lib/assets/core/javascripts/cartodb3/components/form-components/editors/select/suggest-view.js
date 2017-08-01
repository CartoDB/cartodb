var Backbone = require('backbone');
var EditorHelpers = require('../editor-helpers-extend');
var _ = require('underscore');
var CustomListCollection = require('../../../custom-list/custom-list-collection');
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
    this.collection = new CustomListCollection(this.options.options);

    if (this.options.editorAttrs && this.options.editorAttrs.collectionData) {
      var categories = _.map(this.options.editorAttrs.collectionData, function (d) {
        return { label: d, val: d };
      });

      this.collection.reset(categories);
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

  _renderButton: function (mdl) {
    var button = this.$('.js-button');
    var name = mdl.getName();
    var isNull = name === null || name === 'null';
    var label = isNull ? 'null' : name;

    var data = _.extend({}, mdl.attributes, { label: label });
    var $html = this.options.selectedItemTemplate(data);

    button
      .html($html)
      .toggleClass('is-empty', isNull);

    return button;
  }

});
