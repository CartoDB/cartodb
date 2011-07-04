

    $(document).ready(function(){
      
      // Hide notification if it is opened
      $('div.notification').delay(4000).fadeOut();
      
      //Add fake password
      $('input#user_password').val('lalalala');
      $('input#user_password_confirmation').val('lalalala');
      
      // Focus hide label
      $('div.unlock_window input[type="password"]').focusin(function(){
        $('span.top label').hide();
      });

      // Focus show label
      $('div.unlock_window input[type="password"]').focusout(function(){
        var value = $(this).val();
        if (value=="") {
          $('div.unlock_window span.top label').show();
        }
      });

      // Unlock form
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
          $('#user_password').focus();
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

      // Show delete window
      $('a.delete_account:not(.disabled)').live('click', function(ev){
        $('div.mamufas div.delete_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });
      
      // Show forget window effect
      $('a.forget').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
				if (!$(this).hasClass('disabled')) {
	        showForget();
				}
      });
      
      //Close notification
      $('div.notification a.close_notification').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.notification').fadeOut();
      });
    });


    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.create_window').hide();
						resetUnlock();
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
				resetUnlock();
      });
      unbindESC();
    };
    
    function showForget() {
	    $('div.unlock_window div.inner_').animate({borderColor:'#67BA6A'},50);
      $('div.unlock_window .inner_').animate({height:'72px'},300);
			$('div.unlock_window a.close_unlock').delay(150).css('background-position','0 -48px');
      $('div.unlock_window form').animate({opacity:0,},300,function(){
        $('div.unlock_window form').hide();
        $('div.unlock_window div.inner_').css('background-position','-200px -200px');
        $('div.email_sent').show();
        $('div.email_sent').animate({opacity:1},300);
      });
    };
    
    function resetUnlock() {
      $('div.unlock_window .inner_').animate({height:'117px'},300);
      $('div.unlock_window form').css('opacity',1);
			$('div.unlock_window a.close_unlock').css('background-position','0 0');
      $('div.unlock_window div.inner_').css('border','2px solid #FF6600');
      $('div.unlock_window form').show();
      $('div.unlock_window div.inner_').css('background-position','15px 15px');
      $('div.email_sent').hide();
      $('div.email_sent').css('opacity',1);
    }