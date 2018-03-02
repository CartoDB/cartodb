const Backbone = require('backbone');
const _ = require('underscore');
const LikeModel = require('dashboard/data/like-model');
const VisualizationOrderModel = require('dashboard/data/visualization-order-model');
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

    this.order = new VisualizationOrderModel({ visualization: this });

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

    return data;
  },

  toJSON: function () {
    var attr = _.clone(this.attributes);

    delete attr.bindMap;
    delete attr.stats;
    delete attr.related_tables;
    delete attr.children;

    attr.map_id = this.map.id;
    attr.transition_options = this.transition.toJSON();

    return attr;
  }
});
