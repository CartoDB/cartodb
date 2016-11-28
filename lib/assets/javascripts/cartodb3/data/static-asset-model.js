var _ = require('underscore');
var AssetModel = require('./asset-model');

module.exports = AssetModel.extend({

  defaults: {
    ext: 'svg',
    folder: 'maki-icons',
    host: 'http://com.cartodb.users-assets.production.s3.amazonaws.com',
    kind: 'marker',
    name: '',
    public_url: '',
    size: '18',
    state: 'idle'
  },

  toJSON: function () {
    var c = _.clone(this.attributes);
    var url = this.get('host') + '/' + this.get('folder') + '/' + c['icon'];
    var size = this.get('size') ? '-' + this.get('size') : '';

    c['public_url'] = url + size + '.' + this.get('ext');
    return c;
  },

  get: function (attr) {
    var r = this.attributes[attr];

    if (attr === 'public_url') {
      var url = this.get('host') + '/' + this.get('folder') + '/' + this.attributes['icon'];
      var size = this.get('size') ? '-' + this.get('size') : '';

      r = url + size + '.' + this.get('ext');
    }

    return r;
  }
});
