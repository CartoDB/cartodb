
  head(function(){
    if ($('input[type="text"]').attr('value')=="Insert your email") {
      $('input[type="text"]').css('font-style','italic');
      $('input[type="text"]').css('color','#999999');
    }
    
    $('input[type="text"]').focusin(function(){
      var value = $(this).attr('value');
      if (value=="Insert your email") {
        $(this).attr('value','');
        $(this).css('font-style','normal');
        $(this).css('color','#333333');
      }
    });
    $('input[type="text"]').focusout(function(){
      var value = $(this).attr('value');
      if (value=="Insert your email" || value=="") {
        $(this).attr('value','Insert your email');
        $(this).css('font-style','italic');
        $(this).css('color','#999999');
      }
    });
    $('div.error_content').delay(3000).fadeOut();
  });