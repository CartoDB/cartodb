/**
 *  MapCard previews
 *
 */
module.exports = cdb.core.View.extend({

  tagName: 'div',
  className: 'stats',

  options: {
    width:        300,
    height:       170
  },

  initialize: function() {

  },

  render: function() {

    var host = this.options.router.currentUserUrl.host();

    var vizjson = host + "/api/v2/viz/" + this.model.get("id") + "/viz.json";

    var width   = this.options.width;
    var height  = this.options.height;
    var $header = this.options.el;

    $header.addClass("is-loading");

    cdb.Image(vizjson).size(width, height).getUrl(function(error, url) {

      var onError = function(error) {
        $header.removeClass("is-loading");
        $header.addClass("has-error");

        var r = Math.round(Math.random() * 4); // number to get a random placeholder
        var $error = $('<div class="MapCard-error error-0' + r + '" />');
        $header.append($error);
        $error.fadeIn(250);
      };

      if (error) {
        onError(error);
      } else {

        var img = new Image(); 

        img.onerror = function() {
          onError(error);
        }

        img.onload  = function() {
          var $img = $('<img class="MapCard-preview" src="' + url + '" />');
          $header.append($img);
          $header.removeClass("is-loading");
          $img.fadeIn(250);
        };

        img.src = url;

      }

    });

    return this;
  }

});
