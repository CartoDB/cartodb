$(function() {

  var separate = window.location.host.split('.');
  separate.shift();
  var host = separate.join('.');

  var url = "//" + window.location.host  + "/api/v1/get_authenticated_users";

  var onResponse = function(users, status, response) {

    if (response.status == 200 && users && users.length > 0) {

      var baseURL = "http://" + users[0] + "." +  host;

      url = baseURL + "/dashboard";

      var $signin = $("a.signin");

      $signin.text("Your dashboard");
      $signin.attr("href", url);
      $signin.attr("title", "Your dashboard");

    }

  }

  $.getJSON(url, {}, onResponse);

});
