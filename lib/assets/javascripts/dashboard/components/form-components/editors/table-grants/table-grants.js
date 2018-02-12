const Backbone = require('backbone');
const template = require('./table-grants.tpl');
const EditorHelpers = require('cartodb3/components/form-components/editors/editor-helpers-extend');

Backbone.Form.editors.TableGrants = Backbone.Form.editors.Base.extend({
  className: 'ApiKeysForm-grantsTable',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.value = this.options.value;
    this.isDisabled = this.options.editorAttrs.disabled;

    this._initViews();
  },

  _initViews: function () {
    this._formView = this._generateForm();
    this.$el.html(this._formView.render().el);
  },

  // This is called with Backbone.Form context
  _generateMarkup: function () {
    const rows = Object.keys(this.data).map((tableName) => `
      <li class="ApiKeysForm-grantsTable-item">
        <span>${tableName}</span>
        <div data-fields="${tableName}"></div>
      </li>
    `);

    return template({ rows });
  },

  _generateForm: function () {
    const tables = Object.keys(this.value);
    const params = {
      type: 'MultiCheckbox',
      title: false,
      editorAttrs: {
        disabled: this.isDisabled,
        inputs: [
          { name: 'select', label: 'Read' },
          { name: 'update', label: 'Write' },
          { name: 'insert', label: 'Insert' },
          { name: 'delete', label: 'Delete' }
        ]
      }
    };

    const schema = tables.reduce((total, tableName) => ({
      ...total,
      [tableName]: params
    }), {});

    const data = tables.reduce((total, tableName) => ({
      ...total,
      [tableName]: this.value[tableName].permissions
    }), {});

    return new Backbone.Form({ data, schema, template: this._generateMarkup });
  },

  getValue: function () {
    return this._formView.getValue();
  },

  setValue: function (value) {
    this.value = value;
  }
});
