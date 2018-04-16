const Backbone = require('backbone');
const _ = require('underscore');
const LikeModel = require('dashboard/data/like-model');
const UserModel = require('dashboard/data/user-model');
const PermissionModel = require('dashboard/data/permission-model');
const VisualizationOrderModel = require('dashboard/data/visualization-order-model');
const SlideTransition = require('dashboard/data/slide-transition-model');
const MapUrlModel = require('dashboard/data/map-url-model');
const DatasetUrlModel = require('dashboard/data/dataset-url-model');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Model.extend({

  defaults: {
    bindMap: true
  },

  INHERIT_TABLE_ATTRIBUTES: [
    'name', 'description', 'privacy'
  ],

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.permission = new PermissionModel(this.get('permission'));
    this.order = new VisualizationOrderModel({ visualization: this });
    this.transition = new SlideTransition(this.get('transition_options'), { parse: true });

    this.like = LikeModel.newByVisData({
      vis_id: this.id,
      liked: this.get('liked'),
      likes: this.get('likes'),
      config: this._configModel
    });
  },

  url: function (method) {
    var version = this._configModel.urlVersion('visualization', method);
    var base = '/api/' + version + '/viz';
    if (this.isNew()) {
      return base;
    }
    return base + '/' + this.id;
  },

  parse: function (data) {
    if (this.transition && data.transition_options) {
      this.transition.set(this.transition.parse(data.transition_options));
    }

    if (this.like) {
      this.like.set({
        vis_id: this.id,
        likes: this.get('likes'),
        liked: this.get('liked')
      });
    }

    if (this.owner) {
      this.owner = new UserModel(this.owner);
    }

    return data;
  },

  toJSON: function () {
    var attr = _.clone(this.attributes);

    delete attr.bindMap;
    delete attr.stats;
    delete attr.related_tables;
    delete attr.children;

    attr.transition_options = this.transition.toJSON();

    return attr;
  },

  /**
   * Get the URL for current instance.
   * @param {Object} currentUser (Optional) Get the URL from the perspective of the current user, necessary to
   *   correctly setup URLs to tables.
   * @return {Object} instance of cdb.common.Url
   */
  viewUrl: function (currentUser) {
    const owner = this.permission.owner;
    let userUrl = this.permission.owner.viewUrl();

    // the undefined check is required for backward compability, in some cases (e.g. dependant visualizations) the type
    // is not available on the attrs, if so assume the old behavior (e.g. it's a visualization/derived/map).
    if (this.isVisualization() || _.isUndefined(this.get('type'))) {
      let id = this.get('id');

      if (currentUser && currentUser.id !== owner.id && this.permission.hasAccess(currentUser)) {
        userUrl = currentUser.viewUrl();
        id = owner.get('username') + '.' + id;
      }

      return new MapUrlModel({
        base_url: userUrl.urlToPath('viz', id)
      });
    } else {
      if (currentUser && this.permission.hasAccess(currentUser)) {
        userUrl = currentUser.viewUrl();
      }
      return new DatasetUrlModel({
        base_url: userUrl.urlToPath('tables', this.tableMetadata().getUnquotedName())
      });
    }
  },

  /**
   *  Is this model a true visualization?
   */
  isVisualization: function () {
    return this.get('type') === 'derived' || this.get('type') === 'slide';
  },

  /**
   * Get table metadata related to this vis.
   * Note that you might need to do a {metadata.fetch()} to get full data.
   *
   * @returns {CartoTableMetadata} if this vis represents a table
   * TODO: when and when isn't it required to do a fetch really?
   */
  tableMetadata: function () {
    if (!this._metadata) {
      this._metadata = new CartoTableMetadata(this.get('table'), { configModel: this._configModel });
    }
    return this._metadata;
  }
});
