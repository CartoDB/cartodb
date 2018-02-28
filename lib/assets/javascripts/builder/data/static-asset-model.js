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
    var attributes = _.clone(this.attributes);

    attributes['public_url'] = this.getURLFor(attributes['icon']);
    return attributes;
  },

  get: function (attributeName) {
    var attribute = this.attributes[attributeName];

    if (attributeName === 'public_url') {
      attribute = this.getURLFor(this.attributes['icon']);
    }

    return attribute;
  }
});
