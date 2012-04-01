
$(function() {

  // If page has sessions forms
  if ($('section.sessions').length > 0) {
    //Check if the username field is empty and if we have a subdomain and fill it automatically and focus
    //on the password
    if ($("#email").val()=="" && window.location.host.split(".").length>1) {
        $("#email").val(window.location.host.split(".")[0]);
        $('#password').focus();
    }    

    // Show errors
    $('section.sessions div.error').showErrors();

    // Placeholder hack
    $('section.sessions input[data-label]').placeholder();
  }
});
    