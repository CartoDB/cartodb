$(function() {

  function belongsToOrganization() {
    return true
  }

  function isLoggedWithCurrentSubdomain(subdomain, subdomains) {

    if (subdomain) {
      for (var i=0; i<subdomains.length; i++) {
        if (subdomains[i] == subdomain) return true;
      }
    }

    return false;
  }

  // returns true if the user is in public dashboard
  // uses location.pathname to know if
  function in_public_dashboard() {
    var pathname = location.pathname;
    if (pathname.indexOf('table') !== -1 || pathname.indexOf('map') !== -1) {
      return false;
    }
    return true;
  }

  var separate  = window.location.host.split('.');
  var subdomain = separate.shift();

  var host = separate.join('.');

  var url = "//" + window.location.host  + "/api/v1/get_authenticated_users";

  var onResponse = function(users, status, response) {
    var $signin = $("a.signin");

    if (response.status == 200 && users && users.urls.length > 0) {

      url = users.urls[0];

      if (in_public_dashboard()) {
        $signin.text("Your dashboard");
        $signin.attr("href", url);
        $signin.attr("title", "Your dashboard");
      } else {
        $signin.hide();
        $('#the_logo').attr('href', url);
      }
      if (users.can_fork) {
        // enable copy table
        $('.fork').show();
      }
    } else {
      // Check if domain comes from cartodb or other place
      $signin.attr('href', '//' + separate.join('.') + '/login');
    }
  }

  $.getJSON(url, {}, onResponse);

});
