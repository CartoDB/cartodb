var _ = require('underscore');
var WidgetsFormBaseSchema = require('./widgets-form-base-schema-model');

module.exports = WidgetsFormBaseSchema.extend({

  defaults: {
    schema: {},
    aggregate: {
      attribute: '',
      operator: 'count'
    }
  },

  initialize: function (attrs, opts) {
    if (!opts.columnOptionsFactory) throw new Error('columnOptionsFactory is required');
    this._columnOptionsFactory = opts.columnOptionsFactory;

    this.listenTo(this, 'change:aggregate', this._updateAggregate);

    this._updateAggregate();

    WidgetsFormBaseSchema.prototype.initialize.apply(this, arguments);
  },

  parse: function (r) {
    r.aggregate = {
      attribute: r.column,
      operator: r.operation
    };

    return r;
  },

  getFields: function () {
    return {
      data: 'aggregate,prefix,suffix,description',
      style: 'sync_on_bbox_change'
    };
  },

  _updateAggregate: function () {
    var aggregate = this.get('aggregate');
    this.set({
      column: aggregate.attribute,
      operation: aggregate.operator
    });

    this.updateSchema();
  },

  updateSchema: function () {
    var columnOptions = this._columnOptionsFactory.create(this.get('column'), this._isNumberType);

    this.schema = _.extend(this.schema, {
      aggregate: {
        type: 'Operators',
        title: _t('editor.widgets.widgets-form.data.operation'),
        options: columnOptions,
        dialogMode: 'float',
        editorAttrs: {
          showSearch: false
        }
      },
      suffix: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.widgets.widgets-form.data.suffix'),
        editor: {
          type: 'Text'
        }
      },
      prefix: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.widgets.widgets-form.data.prefix'),
        editor: {
          type: 'Text'
        }
      },
      description: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.widgets.widgets-form.style.description'),
        editor: {
          type: 'TextArea'
        }
      }
    });
  },

  canSave: function () {
    var column = this.get('column');
    var operation = this.get('operation');

    return operation === 'count' || !!column;
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }
});
