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
    var self = this;

    var selectedAll = true;

    _.each(this._getColumnNames(), function (field) {
      if (!self.model.containsField(field)) {
        selectedAll = false;
      }
    });

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
    var self = this;

    var names = this._sortedFields.map(function (w) { return w.get('name'); });
    var promises = [];

    _.each(names, function (f) {
      if (!self.model.containsField(f)) {
        promises.push(self.model._addField(f));
      }
    });

    $.when.apply($, promises).then(function () {
      self.model.sortFields();
      self.model.trigger('add:fields');
      self.model.trigger('change:fields', self.model, self.model.get('fields'));
      self.model.trigger('change', self.model);

      self._toggleSelectAll();
    });
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
    var self = this;
    this._sortedFields.reset([]);

    this.$('.js-fields > .js-field').each(function (index, item) {
      var view = self._subviews[$(item).data('view-cid')];

      self.model.setFieldProperty(view.fieldName, 'position', index);
      view.position = index;

      self._sortedFields.add({
        name: view.fieldName,
        position: index
      });
    });
  },

  _getSortedColumnNames: function () {
    var self = this;
    var names = this._getColumnNames();

    if (self.model.fieldCount() > 0) {
      names.sort(function (a, b) {
        var pos_a = self.model.getFieldPos(a);
        var pos_b = self.model.getFieldPos(b);
        return pos_a - pos_b;
      });
    }
    return names;
  },

  _storeSortedFields: function () {
    var self = this;

    this._sortedFields.reset([]);

    var names = this._getSortedColumnNames();
    _(names).each(function (name, position) {
      self._sortedFields.add({
        name: name,
        position: position
      });
    });
  },

  _getColumnNames: function () {
    var self = this;

    var filteredColumns = this._querySchemaModel.columnsCollection.filter(function (c) {
      return !_.contains(self.model.SYSTEM_COLUMNS, c.get('name'));
    });

    var columnNames = [];

    _.each(filteredColumns, function (m) {
      columnNames.push(m.get('name'));
    });

    return columnNames;
  },

  _renderFields: function () {
    var self = this;

    var names = this._getSortedColumnNames();

    _(names).each(function (f, i) {
      var title = self.model.getFieldProperty(f, 'title');

      var view = new FieldView({
        layerInfowindowModel: self.model,
        field: { name: f, title: title },
        position: self.model.getFieldPos(f)
      });

      self.addView(view);
      self.$('.js-fields').append(view.render().el);
    });
  },

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
