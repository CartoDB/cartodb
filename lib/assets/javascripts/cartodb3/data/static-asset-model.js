var _ = require('underscore');
var AssetModel = require('./asset-model');

module.exports = AssetModel.extend({

  defaults: {
    state: 'idle',
    public_url: '',
    kind: 'marker',
    name: '',
    host: 'http://com.cartodb.users-assets.production.s3.amazonaws.com',
    folder: 'maki-icons',
    ext: 'svg',
    size: '18'
  },

  toJSON: function () {
    var c = _.clone(this.attributes);

    c['public_url'] = this.get('host') + '/' + this.get('folder') + '/' + c['icon'] + (this.get('size') ? '-' + this.get('size') : '') + '.' + this.get('ext');
    return c;
  },

  get: function (attr) {
    var r = this.attributes[attr];

    if (attr === 'public_url') {
      r = this.get('host') + '/' + this.get('folder') + '/' + this.attributes['icon'] + (this.get('size') ? '-' + this.get('size') : '') + '.' + this.get('ext');
    }

    return r;
  }
});
