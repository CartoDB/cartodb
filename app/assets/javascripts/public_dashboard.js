$(function() {

  var url = "//" + window.location.host  + "/api/v1/get_authenticated_users";

  var onResponse = function(users, status, response) {

    if (response.status == 200 && users && users.length > 0) {

      url = "http://" + users[0] + ".cartodb.com/dashboard";

      var $dashboard = $("li.dashboard");
      var $a         = $dashboard.find("a");

      $a.text("Your dashboard");
      $a.attr("href", url);
      $a.attr("title", "Your dashboard");

      $dashboard.removeClass("hide");

      var $signin = $("a.signin");

      url = "http://" + users[0] + ".cartodb.com/logout";

      $signin.text("Logout");
      $signin.attr("href", url);
      $signin.attr("title", "Logout");

    }

  }

  $.getJSON(url, {}, onResponse);

});
