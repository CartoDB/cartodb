
head(function(){    
    $('div.error_content').delay(2000).fadeOut();
    
    
    //Check if the username field is empty and if we have a subdomain and fill it automatically and focus
    //on the password
    if ($("#email").val()=="" && window.location.host.split(".").length>1) {
        $("#email").val(window.location.host.split(".")[0]);
        $('#password').focus();
    }
    
});