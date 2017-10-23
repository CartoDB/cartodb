var Utils = require('cdb.Utils');
var markdown = require('markdown');
var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';

var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

var _t = polyglot.t.bind(polyglot);

module.exports = {
  addPublicMapMeta: function (assetsUrl, vizdata, mapOwnerUser) {
    var $faviconLink = document.createElement('link');
    var $metaAuthor = document.createElement('link');
    var $metaDescription = document.createElement('link');
    var $metaKeywords = document.createElement('link');

    var author = mapOwnerUser.nameOrUsername();
    var createdByAuthor = _t(
      'helpers.static_header_meta_tags.map_created_by',
      { author: author });

    var description = vizdata.description
      ? Utils.stripHTML(markdown.toHTML(vizdata.description)) + ' — ' + createdByAuthor
      : createdByAuthor;

    var faviconUrl = assetsUrl + '/favicons/favicon.ico?1505307019';
    var keywords = vizdata.name.split(' ').join(', ') + 'datasets, maps, data visualization, spatial data, geospatial, CARTO';

    $faviconLink.setAttribute('href', faviconUrl);
    $faviconLink.setAttribute('rel', 'shortcut icon');
    $faviconLink.setAttribute('type', 'image/vnd.microsoft.icon');

    $metaAuthor.setAttribute('name', 'author');
    $metaAuthor.setAttribute('content', author);

    $metaDescription.setAttribute('name', 'description');
    $metaDescription.setAttribute('content', description);

    $metaKeywords.setAttribute('name', 'keywords');
    $metaKeywords.setAttribute('content', keywords);

    document.title = vizdata.name;
    document.head.appendChild($faviconLink);
    document.head.appendChild($metaAuthor);
    document.head.appendChild($metaDescription);
    document.head.appendChild($metaKeywords);
  }
}
