var FieldView = require('./infowindow-field-view.js');
var InfowindowDescriptionView = require('./infowindow-description-view.js');
var template = require('./infowindow-fields.tpl');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
require('jquery-ui/sortable');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._columnsCollection = this._querySchemaModel.columnsCollection;

    // An internal collection to keep track of the columns and their order
    this._sortedFields = new Backbone.Collection();
    this._sortedFields.comparator = function (model) {
      return model.get('position');
    };

    this._initBinds();
  },

  _initBinds: function () {
    this._layerInfowindowModel.bind('remove:fields', this.render, this);
    this._layerInfowindowModel.bind('add:fields', this.render, this);

    this.add_related_model(this._layerInfowindowModel);
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
      layerInfowindowModel: this._layerInfowindowModel,
      namesCount: this._getColumnNames().length
    });

    this._fieldsDescriptionView.bind('toggle', this.manageAll, this);

    this.addView(this._fieldsDescriptionView);
    this.$('.js-description').append(this._fieldsDescriptionView.render().el);
  },

  _renderSelectAll: function () {
    this.selectedAll = this._allFieldsSelected();
  },

  _allFieldsSelected: function () {
    var self = this;

    var selectedAll = true;

    _(this._getColumnNames()).each(function (field) {
      if (!self._layerInfowindowModel.containsField(field)) {
        selectedAll = false;
      }
    });

    return selectedAll;
  },

  manageAll: function (e) {
    this._layerInfowindowModel.clearFields();

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

    _(names).each(function (f) {
      promises.push(self._layerInfowindowModel._addField(f));
    });

    $.when.apply($, promises).then(function () {
      self._layerInfowindowModel.sortFields();
      self._layerInfowindowModel.trigger('change:fields');

      self._toggleSelectAll();
    });
  },

  _unselectAll: function () {
    this._layerInfowindowModel.trigger('change:fields');
    this._toggleSelectAll();
  },

  _toggleSelectAll: function () {
    this.selectedAll = !this.selectedAll;
    this.render();
  },

  _initSortable: function () {
    this.$('.js-fields').sortable({
      axis: 'y',
      items: '> li',
      opacity: 0.8,
      update: this._onSortableFinish.bind(this),
      forcePlaceholderSize: false
    }).disableSelection();
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
      self._layerInfowindowModel.setFieldProperty(view.fieldName, 'position', index);
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
    if (self._layerInfowindowModel.fieldCount() > 0) {
      names.sort(function (a, b) {
        var pos_a = self._layerInfowindowModel.getFieldPos(a);
        var pos_b = self._layerInfowindowModel.getFieldPos(b);
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

    var columns = this._columnsCollection.models;

    var filteredColumns = _(columns).filter(function (c) {
      return !_.contains(self._layerInfowindowModel.SYSTEM_COLUMNS, c.get('name'));
    });

    var columnNames = [];

    _(filteredColumns).each(function (m) {
      columnNames.push(m.get('name'));
    });

    return columnNames;
  },

  _renderFields: function () {
    var self = this;

    var names = this._getColumnNames();

    names.sort(function (a, b) {
      var pos_a = self._layerInfowindowModel.getFieldPos(a);
      var pos_b = self._layerInfowindowModel.getFieldPos(b);
      return pos_a - pos_b;
    });

    _(names).each(function (f, i) {
      var title = false;
      if (self._layerInfowindowModel.containsField(f)) {
        var pos = _.indexOf(_(self._layerInfowindowModel.get('fields')).pluck('name'), f);
        title = self._layerInfowindowModel.get('fields')[pos] && self._layerInfowindowModel.get('fields')[pos].title;
      }

      var view = new FieldView({
        layerInfowindowModel: self._layerInfowindowModel,
        field: { name: f, title: title },
        position: self._layerInfowindowModel.getFieldPos(f)
      });
      self.addView(view);
      self.$('.js-fields').append(view.render().el);
    });
  },

  clean: function () {
    this._destroySortable();
    cdb.core.View.prototype.clean.apply(this);
  }
});
