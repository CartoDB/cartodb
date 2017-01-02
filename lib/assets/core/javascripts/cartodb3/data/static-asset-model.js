var _ = require('underscore');
var AssetModel = require('./asset-model');

module.exports = AssetModel.extend({

  defaults: {
    ext: 'svg',
    folder: 'maki-icons',
    host: 'https://s3.amazonaws.com',
    bucket: 'com.cartodb.users-assets.production',
    kind: 'marker',
    name: '',
    public_url: '',
    size: '18',
    state: 'idle'
  },

  getURLFor: function (name) {
    var url = this.get('host') + '/' + this.get('bucket') + '/' + this.get('folder') + '/' + name;
    var size = this.get('size') ? '-' + this.get('size') : '';
    return url + size + '.' + this.get('ext');
  },

  toJSON: function () {
    var c = _.clone(this.attributes);

    c['public_url'] = this.getURLFor(c['icon']);
    return c;
  },

  get: function (attr) {
    var r = this.attributes[attr];

    if (attr === 'public_url') {
      r = this.getURLFor(this.attributes['icon']);
    }

    return r;
  }
});
