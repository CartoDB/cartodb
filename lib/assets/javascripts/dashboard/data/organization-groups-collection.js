const Backbone = require('backbone');
const GroupModel = require('dashboard/data/group-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * A collection that holds a set of organization groups
 */
module.exports = Backbone.Collection.extend({

  model: function (attrs, { collection }) {
    return new GroupModel(attrs, {
      collection,
      configModel: collection._configModel
    });
  },

  url: function (method) {
    var version = this._configModel.urlVersion('organizationGroups', method);
    return '/api/' + version + '/organization/' + this.organization.id + '/groups';
  },

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    if (!opts.organization) throw new Error('organization is required');
    this.organization = opts.organization;
  },

  parse: function (response) {
    this.total_entries = response.total_entries;
    return response.groups;
  },

  // @return {Object} A instance of cdb.admin.Group. If group wasn't already present a new model with id and collection
  //  set will be returned, i.e. group.fetch() will be required to get the data or handle the err case (e.g. non-existing)
  newGroupById: function (id) {
    var group = this.get(id);
    if (!group) {
      group = new GroupModel({
        id: id
      }, { configModel: this._configModel, collection: this });
    }
    return group;
  },

  // @return {Number, undefined} may be undefined until a first fetch is done
  totalCount: function () {
    return this.total_entries;
  }

});
