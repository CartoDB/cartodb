var Backbone = require('backbone');
var _ = require('underscore');

var LikeModel = Backbone.Model.extend({
  defaults: {
    likeable: true
  },

  url: function (method) {
    var version = this._configModel.urlVersion('like');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/viz/' + this.get('vis_id') + '/like';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!attrs.vis_id) throw new Error('vis_id attribute is required');
    this._configModel = opts.configModel;

    this.on('destroy', function () {
      this.set({
        liked: false,
        likes: this.get('likes') - 1
      });
    }, this);
  },

  _onSaveError: function (model, response) {
    this.trigger('error', {
      status: response.status,
      statusText: response.statusText
    });
  },

  toggleLiked: function () {
    if (this.get('liked')) {
      this.destroy();
    } else {
      this.set({ id: null }, { silent: true });
      this.save({}, {
        error: this._onSaveError.bind(this)
      });
    }
  }

}, {
  newByVisData: function (opts) {
    var d = _.defaults({
      id: opts.liked ? opts.vis_id : null
    }, _.omit(opts, 'url', 'configModel'));

    var m = new LikeModel(d, {
      configModel: opts.configModel
    });

    if (opts.url) {
      m.url = opts.url;
    }

    return m;
  }
});

module.exports = LikeModel;
