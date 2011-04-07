

    $(document).ready(function(){

      $('div.unlock_window span.top p').click(function(){
        $('div.unlock_window span.top input[type="password"]').focus();
      });
      
      $('div.unlock_window input[type="password"]').focusin(function(){
        $('span.top p').hide();
      });
      
      $('div.unlock_window input[type="password"]').focusout(function(){
        var value = $(this).val();
        if (value=="") {
          $('div.unlock_window span.top p').show();
        }
      });

      //Close all modal windows
      $('div.mamufas a.cancel, div.mamufas a.close_unlock').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.unlock_window').hide();
        });
        unbindESC();
      });


      //Unlock window
      $('a.open_unlock').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.mamufas div.unlock_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });
    });
    
    
    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.create_window').hide();
          });
        }
      });
    }

    function unbindESC() {
      $(document).unbind('keydown');
    }