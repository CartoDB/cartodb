
      $(function() {
        $('.MapCard').each(function() {
          var vizjson = $(this).attr("vizjson-url");

          var $header = $(this).find(".js-header");

          $header.addClass("is-loading");

          cdb.Image(vizjson).size(340, 200).getUrl(function(error, url) {

            var onError = function(error) {
              $header.removeClass("is-loading");
              $header.addClass("has-error");
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

        });
      });
