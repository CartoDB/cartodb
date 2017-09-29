var FieldView = require('./infowindow-field-view.js');
var InfowindowDescriptionView = require('./infowindow-description-view.js');
var template = require('./infowindow-fields.tpl');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');
require('jquery-ui');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    // An internal collection to keep track of the columns and their order
    this._sortedFields = new Backbone.Collection();
    this._sortedFields.comparator = function (model) {
      return model.get('position');
    };

    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('remove:fields', this._renderDescription, this);
    this.model.bind('add:fields', this._renderDescription, this);
  },

  render: function () {
    this._destroySortable();
    this.clearSubViews();

    this.$el.html(template());

    this._renderDescription();
    this._renderFields();
    this._initSortable();
    this._renderSelectAll();
    this._storeSortedFields();

    return this;
  },

  _renderDescription: function () {
    if (this._fieldsDescriptionView) {
      this.removeView(this._fieldsDescriptionView);
      this._fieldsDescriptionView.clean();
    }

    this._fieldsDescriptionView = new InfowindowDescriptionView({
      model: this.model,
      namesCount: this._getColumnNames().length
    });

    this._fieldsDescriptionView.bind('toggle', this.manageAll, this);

    this.addView(this._fieldsDescriptionView);
    this.$('.js-description').append(this._fieldsDescriptionView.render().el);

    this._renderSelectAll();
  },

  _renderSelectAll: function () {
    this.selectedAll = this._allFieldsSelected();
  },

  _allFieldsSelected: function () {
    var selectedAll = true;

    _.each(this._getColumnNames(), function (field) {
      if (!this.model.containsField(field)) {
        selectedAll = false;
      }
    }, this);

    return selectedAll;
  },

  manageAll: function (e) {
    if (!this.selectedAll) {
      this._selectAll();
    } else {
      this._unselectAll();
    }
  },

  _selectAll: function () {
    var names = this._sortedFields.map(function (w) { return w.get('name'); });
    var promises = [];

    _.each(names, function (f) {
      if (!this.model.containsField(f)) {
        promises.push(this.model._addField(f));
      }
    }, this);

    $.when.apply($, promises).then(function () {
      this.model.sortFields();
      this.model.trigger('add:fields');
      this.model.trigger('change:fields', this.model, this.model.get('fields'));
      this.model.trigger('change', this.model);

      this._toggleSelectAll();
    }.bind(this));
  },

  _unselectAll: function () {
    this.model.clearFields();
    this.model.trigger('change:fields');
    this._toggleSelectAll();
  },

  _toggleSelectAll: function () {
    this.selectedAll = !this.selectedAll;
    this._renderDescription();
  },

  _initSortable: function () {
    this.$('.js-fields').sortable({
      axis: 'y',
      items: '> li',
      opacity: 0.8,
      update: this._onSortableFinish.bind(this),
      forcePlaceholderSize: false
    });
  },

  _destroySortable: function () {
    if (this.$('.js-fields').data('ui-sortable')) {
      this.$('.js-fields').sortable('destroy');
    }
  },

  _onSortableFinish: function () {
    this._storeSortedFields();
  },

  _getSortedColumnNames: function () {
    var names = this._getColumnNames();

    if (this.model.fieldCount() > 0) {
      names.sort(function (a, b) {
        var pos_a = this.model.getFieldPos(a);
        var pos_b = this.model.getFieldPos(b);
        return pos_a - pos_b;
      }.bind(this));
    }
    return names;
  },

  _storeSortedFields: function () {
    this._sortedFields.reset([]);

    this.$('.js-fields > .js-field').each(function (index, item) {
      var view = this._subviews[$(item).data('view-cid')];

      this.model.setFieldProperty(view.fieldName, 'position', index);
      view.position = index;

      this._sortedFields.add({
        name: view.fieldName,
        position: index
      });
    }.bind(this));
  },

  _getColumnNames: function () {
    var filteredColumns = this._querySchemaModel.columnsCollection.filter(function (c) {
      return !_.contains(this.model.SYSTEM_COLUMNS, c.get('name'));
    }.bind(this));

    var columnNames = [];

    _.each(filteredColumns, function (m) {
      columnNames.push(m.get('name'));
    });

    return columnNames;
  },

  _renderFields: function () {
    var renderField = function (field) {
      var title = this.model.getFieldProperty(field, 'title');

      var view = new FieldView({
        layerInfowindowModel: this.model,
        field: { name: field, title: title },
        position: this.model.getFieldPos(field)
      });

      this.addView(view);
      this.$('.js-fields').append(view.render().el);
    }.bind(this);

    var names = this._getSortedColumnNames();
    var selected = [];
    var fields = this.model.get('fields');

    if (_.isArray(fields)) {
      selected = fields.map(function (field) {
        return field.name;
      });
    }

    var rest = _.difference(names, selected);
    _.each(selected.concat(rest), renderField);
  },

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
