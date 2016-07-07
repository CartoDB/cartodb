var View = require('../../core/view');
var LOGO_URL = 'https://cartodb.s3.amazonaws.com/static/new_logo.png';
var URL = 'http://carto.com';

module.exports = View.extend({
  className: 'CDB-Logo',
  tagName: 'a',

  render: function () {
    var img = document.createElement('img');
    img.setAttribute('src', LOGO_URL);
    img.setAttribute('alt', URL);
    img.setAttribute('title', URL);
    img.setAttribute('target', '_blank');
    this.$el.html(img);
    this.$el.attr('href', URL);
    return this;
  }
});
