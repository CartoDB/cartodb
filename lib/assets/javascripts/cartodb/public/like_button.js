function like($el, url) {

  var $icon    = $el.find(".icon");
  var $counter = $el.find(".counter");

  var onSuccess = function(response) {

    $counter.text(response.likes_count);
    $el.attr("data-liked", 1);

    $el.addClass("is-highlighted");
    $icon.addClass("is-pulsating is-animated");

    $icon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      $(this).removeClass("is-pulsating is-animated");
    });

  };

  $.ajax({
    type: "POST",
    url: url,
    success: onSuccess
  });
}

function unlike($el, url) {

  var $icon    = $el.find(".icon");
  var $counter = $el.find(".counter");

  var onSuccess = function(response) {

    $counter.text(response.likes_count);
    $el.attr("data-liked", 0);

    $icon.addClass("is-pulsating is-animated");

    $icon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      $(this).removeClass("is-pulsating is-animated");
      $el.removeClass("is-highlighted");
    });

  };

  $.ajax({
    type: "DELETE",
    url: url,
    success: onSuccess
  });

}
