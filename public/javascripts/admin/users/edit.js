

    $(document).ready(function(){

      $('div.unlock_window input[type="password"]').focusin(function(){
        $('span.top label').hide();
      });

      $('div.unlock_window input[type="password"]').focusout(function(){
        var value = $(this).val();
        if (value=="") {
          $('div.unlock_window span.top label').show();
        }
      });

      $('div.unlock_window form').submit(function(ev){
        ev.preventDefault();
        $.post($(this).attr('action'), $(this).serialize())
        .success(function(){
          $('#user_email, #user_password, #user_password_confirmation').attr('disabled', null);
          close_mamufas();
        })
        .error(function(){
          alert('Invalid password');
        });
      });

      //Close all modal windows
      $('div.mamufas a.cancel, div.mamufas a.close_unlock, , div.mamufas a.close_delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        close_mamufas();
      });


      //Unlock window
      $('a.open_unlock').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.mamufas div.unlock_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });

      //Delete account
      $('a.delete_account').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.mamufas div.delete_window').show();
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
    };

    function unbindESC() {
      $(document).unbind('keydown');
    };

    function close_mamufas(){
      $('div.mamufas').fadeOut('fast',function(){
        $('div.mamufas div.unlock_window').hide();
      });
      unbindESC();
    };