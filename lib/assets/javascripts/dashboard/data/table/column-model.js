const _ = require('underscore');
const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Model.extend({

  idAttribute: 'name',

  url: function (method) {
    var version = this._configModel.urlVersion('column', method);
    var table = this.table || this.collection.table;
    if (!table) {
      console.error('column has no table assigned');
    }

    var base = '/api/' + version + '/tables/' + table.get('name') + '/columns/';
    if (this.isNew()) {
      return base;
    }
    return base + this.id;
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.table = this.get('table');
    if (!this.table) {
      throw 'you should specify a table model'; // eslint-disable-line
    }
    this.unset('table', { silent: true });
  },

  toJSON: function () {
    var c = _.clone(this.attributes);
    // this hack is created to create new column
    // if you set _name instead name backbone does not get
    // it as idAttribute so launch a POST instead of a PUT
    if (c._name) {
      c.name = c._name;
      delete c._name;
    }
    return c;
  }

});
