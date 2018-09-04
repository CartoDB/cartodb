var Utils = require('cdb.Utils');
var markdown = require('markdown');
var MapcardPreview = require('../helpers/mapcard_preview');
var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');
var cdb = require('cartodb.js-v3');


var ACTIVE_LOCALE = 'en';

var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

var _t = polyglot.t.bind(polyglot);

module.exports = {
  addPublicMapMeta: function (assetsUrl, vizdata, mapOwnerUser) {
    var $faviconLink = document.createElement('link');
    var $metaAuthor = document.createElement('meta');
    var $metaDescription = document.createElement('meta');
    var $metaKeywords = document.createElement('meta');

    var author = mapOwnerUser.nameOrUsername();
    var description = _parseDescription.call(this, author, vizdata.description);
    var faviconUrl = assetsUrl + '/favicons/favicon.ico';
    var keywords = vizdata.name.split(' ').join(', ') + 'datasets, maps, data visualization, spatial data, geospatial, CARTO';

    $faviconLink.setAttribute('href', faviconUrl);
    $faviconLink.setAttribute('rel', 'shortcut icon');
    $faviconLink.setAttribute('type', 'image/vnd.microsoft.icon');
    document.head.appendChild($faviconLink);

    $metaAuthor.setAttribute('name', 'author');
    $metaAuthor.setAttribute('content', author);
    document.head.appendChild($metaAuthor);

    $metaDescription.setAttribute('name', 'description');
    $metaDescription.setAttribute('content', description);
    document.head.appendChild($metaDescription);

    $metaKeywords.setAttribute('name', 'keywords');
    $metaKeywords.setAttribute('content', keywords);
    document.head.appendChild($metaKeywords);

    document.title = vizdata.name;

    return this;
  },

  addTwitterMeta: function (vizdata, mapOwnerUser, width, height) {
    var $metaCard = document.createElement('meta');
    var $metaSite = document.createElement('meta');
    var $metaTitle = document.createElement('meta');
    var $metaDescription = document.createElement('meta');
    var $metaImage = document.createElement('meta');

    var title = vizdata.name;
    var author = mapOwnerUser.nameOrUsername();
    var description = _parseDescription.call(this, author, vizdata.description);
    var twitterUsername = mapOwnerUser.get('twitter_username');
    var mapApiTemplate = cdb.config.get('maps_api_template');
    var image = MapcardPreview.urlForStaticMap(mapApiTemplate, vizdata, width, height);

    $metaCard.setAttribute('name', 'twitter:card');
    $metaCard.setAttribute('content', 'summary_large_image');
    document.head.appendChild($metaCard);

    $metaSite.setAttribute('name', 'twitter:site');
    $metaSite.setAttribute('content', '@CARTO');
    document.head.appendChild($metaSite);

    if (twitterUsername) {
      var $metaCreator = document.createElement('meta');

      $metaCreator.setAttribute('name', 'twitter:creator');
      $metaCreator.setAttribute('content', twitterUsername);

      document.head.appendChild($metaCreator);
    }

    $metaTitle.setAttribute('name', 'twitter:title');
    $metaTitle.setAttribute('content', title);
    document.head.appendChild($metaTitle);

    $metaDescription.setAttribute('name', 'twitter:description');
    $metaDescription.setAttribute('content', description);
    document.head.appendChild($metaDescription);

    $metaImage.setAttribute('name', 'twitter:image');
    $metaImage.setAttribute('content', image);
    document.head.appendChild($metaImage);

    return this;
  },

  addFacebookMeta: function (vizdata, mapOwnerUser, width, height) {
    var SITE_NAME = 'CARTO';
    var TYPE = 'article';
    var ARTICLE_PUBLISHER = 'https://www.facebook.com/cartodb';
    var facebookConfig = cdb.config.get('facebook');

    var $metaTitle = document.createElement('meta');
    var $metaSiteName = document.createElement('meta');
    var $metaDescription = document.createElement('meta');
    var $metaType = document.createElement('meta');
    var $metaUrl = document.createElement('meta');
    var $metaImage = document.createElement('meta');
    var $metaArticlePublisher = document.createElement('meta');

    var title = vizdata.name;
    var author = mapOwnerUser.nameOrUsername();
    var description = _parseDescription.call(this, author, vizdata.description);
    var url = window.location.href;
    var mapApiTemplate = cdb.config.get('maps_api_template');
    var image = MapcardPreview.urlForStaticMap(mapApiTemplate, vizdata, width, height);

    $metaTitle.setAttribute('property', 'og:title');
    $metaTitle.setAttribute('content', title);
    document.head.appendChild($metaTitle);

    $metaSiteName.setAttribute('property', 'og:site_name');
    $metaSiteName.setAttribute('content', SITE_NAME);
    document.head.appendChild($metaSiteName);

    $metaDescription.setAttribute('property', 'og:description');
    $metaDescription.setAttribute('content', description);
    document.head.appendChild($metaDescription);

    $metaType.setAttribute('property', 'og:type');
    $metaType.setAttribute('content', TYPE);
    document.head.appendChild($metaType);

    $metaUrl.setAttribute('property', 'og:url');
    $metaUrl.setAttribute('content', url);
    document.head.appendChild($metaUrl);

    $metaImage.setAttribute('property', 'og:image');
    $metaImage.setAttribute('content', image);
    document.head.appendChild($metaImage);

    $metaArticlePublisher.setAttribute('property', 'og:article_publisher');
    $metaArticlePublisher.setAttribute('content', ARTICLE_PUBLISHER);
    document.head.appendChild($metaArticlePublisher);

    if (facebookConfig) {
      var facebookAppId = facebookConfig.get('app_id');
      var facebookAdmins = facebookConfig.get('admins');

      if (facebookAppId) {
        var $metaAppId = document.createElement('meta');
        $metaAppId.setAttribute('property', 'fb:app_id');
        $metaAppId.setAttribute('content', facebookAppId);
        document.head.appendChild($metaAppId);
      }

      if (facebookAdmins) {
        var $metaAdmins = document.createElement('meta');
        $metaAdmins.setAttribute('property', 'fb:admins');
        $metaAdmins.setAttribute('content', facebookAdmins);
        document.head.appendChild($metaAdmins);
      }
    }

    return this;
  }
}

var _parseDescription = function (author, description) {
  var createdByAuthor = _t('helpers.static_header_meta_tags.map_created_by', {
    author: author
  });

  return description
    ? Utils.stripHTML(markdown.toHTML(description)) + ' — ' + createdByAuthor
    : createdByAuthor;
}
