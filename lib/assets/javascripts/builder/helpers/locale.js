var _ = require('underscore');
var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
var Locale = require('locale/index')[ACTIVE_LOCALE];

var LINK_TEMPLATE = _.template("<a href='<%- href %>'><%- link %></a>");

module.exports = {
  /*
  *
  * Sometimes we need to include a link in a message. This function takes a key:
  *
  * {
  *   "body": "You are over platform's limits. Please %{link} to know more details",
  *   "link": "contact us",
  *   "href": "mailto:support@carto.com"
  * }
  *
  * and return the message htmlfied with the link properly included
  */

  linkify: function (key) {
    // microtemplate function
    // underscore doesn't allow change the template settings for one call
    function t (s, d) {
      for (var p in d) {
        s = s.replace(new RegExp('%{' + p + '}', 'g'), d[p]);
      }
      return s;
    }

    var data = this.resolve(key);

    if (!data) {
      return void 0;
    }

    if (_.isString(data)) {
      // we need an object with body, href, link
      return data;
    }

    var message = data.body;
    var link = data.link;
    var href = data.href;

    // If some data is missing or it doesn't need link
    if (!message || !link || !href || !this.needLink(message)) {
      return void 0;
    }

    return t(message, {
      link: LINK_TEMPLATE({
        link: link,
        href: href
      })
    });
  },

  needLink: function (message) {
    return message.indexOf('%{link}') >= 0;
  },

  // It returns the value or undefined for a given locale key
  resolve: function (path) {
    return path.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : void 0;
    }, Locale);
  }
};
