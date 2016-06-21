var _ = require('underscore');
var Backbone = require('backbone');
var DEACTIVATE_MATRIX = {
  'number': ['date'],
  'boolean': ['date'],
  'date': ['boolean']
};
var DESTRUCTIVE_MATRIX = {
  'string': {
    'string': false,
    'number': true,
    'date': true,
    'boolean': true
  },
  'number': {
    'string': false,
    'number': false,
    'date': true,
    'boolean': true
  },
  'date': {
    'string': false,
    'number': true,
    'date': false,
    'boolean': true
  },
  'boolean': {
    'string': false,
    'number': false,
    'date': true,
    'boolean': false
  }
};
var NON_EDITABLE_ATTRIBUTES = [
  'the_geom_webmercator',
  'cartodb_id',
  'the_geom'
];

module.exports = Backbone.Model.extend({

  url: function () {
    if (this._tableName) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('column');
      var url = baseUrl + '/api/' + version + '/tables/' + this._tableName + '/columns/';

      if (!this.isNew()) {
        url += this.previous('name') || this.get('name');
      }

      return url;
    }

    return false;
  },

  parse: function (attrs) {
    return {
      name: attrs.name,
      type: attrs.cartodb_type || attrs.type,
      isNew: false
    };
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableName = opts.tableName;
    this._configModel = opts.configModel;
  },

  isNew: function () {
    return this.get('isNew');
  },

  isEditable: function () {
    return !_.contains(NON_EDITABLE_ATTRIBUTES, this.get('name'));
  },

  validate: function (attrs) {
    if (!attrs.name) {
      return 'Name can\'t be blank';
    }

    return;
  },

  isTypeChangeDestructive: function (type, newType) {
    return DESTRUCTIVE_MATRIX[type][newType];
  },

  isTypeChangeAllowed: function (type, newType) {
    var deactivated = DEACTIVATE_MATRIX[type] || [];
    deactivated = deactivated.concat([type]);
    return !_.contains(deactivated, newType);
  }

});
