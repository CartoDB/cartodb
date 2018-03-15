const _ = require('underscore');
const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

const GRANT_TYPES = {
  APIS: 'apis',
  DATABASE: 'database'
};

const TYPES = {
  MASTER: 'master',
  DEFAULT: 'default',
  REGULAR: 'regular'
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

  initialize: function (attributes, options) {
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

    return {
      ...attrs,
      apis,
      tables,
      id: attrs.name
    };
  },

  toJSON: function () {
    // Extract apis and tables properties to not include in JSON
    const { apis, tables, ...attrs } = this.attributes;

    const grants = [
      { type: GRANT_TYPES.APIS, apis: this.getApiGrants() },
      { type: GRANT_TYPES.DATABASE, tables: this.getTablesGrants() }
    ];

    return { ...attrs, grants };
  },

  isPublic: function () {
    return this.get('type') === TYPES.DEFAULT;
  },

  getApiGrants: function () {
    const apis = this.get('apis');
    return Object.keys(apis).filter(name => apis[name]);
  },

  getTablesGrants: function () {
    const tables = _.map(this.get('tables'), (table, tableName) => ({
      name: tableName,
      schema: this._userModel.getSchema(),
      permissions: Object.keys(table.permissions).filter(name => table.permissions[name])
    }));

    return _.filter(tables, table => table.permissions.length > 0);
  },

  _parseApiGrants: function (grants) {
    const apis = _.find(grants, grant => grant.type === GRANT_TYPES.APIS).apis;
    const apisObj = this._arrayToObj(apis);

    return { ...this.defaults.apis, ...apisObj };
  },

  _parseTableGrants: function (grants) {
    const tables = _.find(grants, grant => grant.type === GRANT_TYPES.DATABASE).tables;
    const tablesObj = tables.reduce((total, table) => {
      const permissions = this._arrayToObj(table.permissions);
      return { ...total, [table.name]: { ...table, permissions } };
    }, {});

    return tablesObj;
  },

  _arrayToObj: function (arr) {
    return arr.reduce((total, item) => ({ ...total, [item]: true }), {});
  },

  hasPermissionsSelected: function () {
    return _.some(this.getTablesGrants().map(table => !_.isEmpty(table.permissions)));
  },

  urlRoot: function () {
    return `${this._userModel.get('base_url')}/api/v3/api_keys`;
  }
});
