const Backbone = require('backbone');
const _ = require('underscore');
const LikeModel = require('dashboard/data/like-model');
const UserModel = require('dashboard/data/user-model');
const PermissionModel = require('dashboard/data/permission-model');
const MapModel = require('dashboard/data/map-model');
const VisualizationOrderModel = require('dashboard/data/visualization-order-model');
const SlideTransition = require('dashboard/data/slide-transition-model');
const MapUrlModel = require('dashboard/data/map-url-model');
const DatasetUrlModel = require('dashboard/data/dataset-url-model');
const UrlModel = require('dashboard/data/url-model');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

const PRIVACY_OPTIONS = {
  default: {
    public: 'PUBLIC',
    link: 'LINK',
    private: 'PRIVATE',
    password: 'PASSWORD'
  },
  kuviz: {
    public: 'PUBLIC',
    password: 'PASSWORD'
  }
};

const VISUALIZATON_TYPES = [
  'derived',
  'kuviz',
  'slide'
];

const VisualizationModel = Backbone.Model.extend({

  defaults: {
    bindMap: true
  },

  INHERIT_TABLE_ATTRIBUTES: [
    'name', 'description', 'privacy'
  ],

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.type = this.get('type');
    if (this.type !== 'kuviz') {
      this.map = new MapModel({ configModel: this._configModel });
      if (this.get('bindMap')) this._bindMap();
    }

    this._privacyOptions = (this.type === 'kuviz') ? PRIVACY_OPTIONS[this.type] : PRIVACY_OPTIONS['default'];
    this.permission = new PermissionModel(this.get('permission'), { configModel: this._configModel });
    this.order = new VisualizationOrderModel({ visualization: this });
    this.transition = new SlideTransition(this.get('transition_options'), { parse: true });

    this.like = LikeModel.newByVisData({
      vis_id: this.id,
      liked: this.get('liked'),
      likes: this.get('likes'),
      config: this._configModel
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.permission.acl.bind('reset', function () {
      // Sync the local permission object w/ the raw data, so vis.save don't accidentally overwrites permissions changes
      this.set('permission', this.permission.attributes, { silent: true });
      this.trigger('change:permission', this);
    }, this);

    // Keep permission model in sync, e.g. on vis.save
    this.bind('change:permission', function () {
      this.permission.set(this.get('permission'));
    }, this);
  },

  _bindMap: function () {
    this.on('change:map_id', this._fetchMap, this);

    this.map.bind('change:id', function () {
      this.set('map_id', this.map.id);
    }, this);

    this.map.set('id', this.get('map_id'));
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

  getLikesModel: function () {
    return this.like;
  },

  /**
   *  Create a copy of the visualization model
   */
  copy: function (attrs, options) {
    attrs = attrs || {};
    options = options || {};
    var vis = new VisualizationModel(
      _.extend({
        source_visualization_id: this.id
      },
      attrs
      ),
      { configModel: this._configModel }
    );
    vis.save(null, options);
    return vis;
  },

  /**
   *  Fetch map information
   */
  _fetchMap: function () {
    this.map
      .set('id', this.get('map_id'))
      .fetch();
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

      if (this.get('type') === 'kuviz') {
        return new UrlModel({
          base_url: userUrl.urlToPath('kuviz', id)
        });
      }

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

  // return: Array of entities (user or organizations) this vis is shared with
  sharedWithEntities: function () {
    return _.map((this.permission.acl.toArray() || []), function (aclItem) {
      return aclItem.get('entity');
    });
  },

  /**
   *  Is this model a true visualization?
   */
  isVisualization: function () {
    const type = this.get('type');
    return VISUALIZATON_TYPES.indexOf(type) > -1;
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
  },

  getTableModel: function () {
    if (!this._metadata) {
      this._metadata = new CartoTableMetadata(this.get('table'), { configModel: this._configModel });
    }
    return this._metadata;
  },

  privacyOptions: function () {
    const privacyOptionsValues = _.values(this._privacyOptions);

    if (this.isVisualization()) {
      return privacyOptionsValues;
    } else {
      return _.filter(privacyOptionsValues, option => option !== 'PASSWORD');
    }
  },

  isRaster: function () {
    return this.get('kind') === 'raster';
  },

  getPermissionModel: function () {
    return this.permission;
  },

  getSynchronizationModel: function () {
    return this._synchronizationModel;
  },

  mapcapsURL: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this.id + '/mapcaps';
  }
}, {
  isPubliclyAvailable: function (privacyStatus) {
    return privacyStatus === PRIVACY_OPTIONS['default'].password ||
           privacyStatus === PRIVACY_OPTIONS['default'].link ||
           privacyStatus === PRIVACY_OPTIONS['default'].public;
  }
});

module.exports = VisualizationModel;
