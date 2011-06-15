

    $(document).ready(function(){
      
      //Add fake password
      $('input#user_password').val('lalalala');
      $('input#user_password_confirmation').val('lalalala');
      

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
          $('div.unlock_window div.error_content').hide()
          $('#user_email, #user_password, #user_password_confirmation').attr('disabled', null);
          $('#user_password_confirmation, #user_password')
            .val('')
            .css({color:'#333333'})
            .removeClass('error')
            .closest('span')
            .find('span.block').hide();
          $('a.delete_account').removeClass('disabled');
          $('input.close').removeClass('close');
          $('div.error_content').hide();
          $('span.submit_block p').text('You have verified your account').css({color:'#999999'});
          close_mamufas();
        })
        .error(function(){
          $('div.unlock_window div.error_content').show()
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
      $('.disabled, .close').live('click', function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.mamufas div.unlock_window').show();
        $('div.mamufas').fadeIn('fast');
      });

      $('a.delete_account:not(.disabled)').live('click', function(ev){
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