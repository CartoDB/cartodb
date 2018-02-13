const _ = require('underscore');
const Backbone = require('backbone');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];
const GRANT_TYPES = {
  APIS: 'apis',
  DATABASE: 'database'
};

module.exports = Backbone.Model.extend({
  defaults: {
    name: '',
    token: '',
    apis: {
      maps: false,
      sql: false
    },
    tables: []
  },

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  regenerate: function () {
    const options = {
      url: `${this.url()}/token/regenerate`,
      type: 'POST',
      success: (data) => this.set(data)
    };

    return this.sync(null, this, options);
  },

  parse: function (data) {
    const { grants, ...attrs } = data;
    const apis = this._parseApiGrants(grants);
    const tables = this._parseTableGrants(grants);

    return { ...attrs, apis, tables, id: attrs.name };
  },

  toJSON: function () {
    const { apis, ...attrs } = this.attributes;

    // TODO: Refactor
    const grants = [
      { type: GRANT_TYPES.APIS, apis: this.getApiGrants() },
      { type: GRANT_TYPES.DATABASE, tables: this.getTablesGrants() }
    ];

    return { ...attrs, grants };
  },

  getApiGrants: function () {
    const apis = this.get('apis');
    return Object.keys(apis).filter(name => apis[name]);
  },

  getTablesGrants: function () {
    return _.map(this.get('tables'), (value, key) => ({
      name: key,
      schema: this._userModel.isOrgUser() ? this._userModel.get('username') : 'public', // TODO: Does this work?
      permissions: Object.keys(value.permissions).filter(name => value.permissions[name])
    }));
  },

  _parseApiGrants: function (grants) {
    const apis = grants.find(grant => grant.type === GRANT_TYPES.APIS).apis;
    const apisObj = this._arrayToObj(apis);

    return Object.assign({}, this.defaults.apis, apisObj);
  },

  _parseTableGrants: function (grants) {
    const tables = grants.find(grant => grant.type === GRANT_TYPES.DATABASE).tables;
    const tablesObj = tables.reduce((total, table) => {
      const permissions = this._arrayToObj(table.permissions);
      return Object.assign(total, { [table.name]: { ...table, permissions } });
    }, {});

    return tablesObj;
  },

  _arrayToObj: function (arr) {
    return arr.reduce((total, item) => Object.assign(total, { [item]: true }), {});
  }
});
