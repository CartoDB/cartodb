
	head(function(){
    
		// Forget password bind
		$('form a').click(function(ev){
			ev.stopPropagation();
			ev.preventDefault();
			var class_name = $(this).attr('class');
			if (class_name=="forget") {
				$('form p.title').text('Recover your password');
				$('form input.login').val('Send email');
				$(this)
					.text('Back to login')
					.removeClass('forget')
					.addClass('login');
				$('span.password').animate({opacity:0},100,function(){
					$(this).animate({height:0},150,function(){
						$(this).hide();
					});
				});
				$('form input').removeClass('error');
				$('div.error_content').hide();
			} else {
				$('form p.title').text('Please login');
				$('form input.login').val('Log in');
				$(this)
					.text('Did you forget your password?')
					.removeClass('login')
					.addClass('forget');
				$('span.password').show();
				$('span.password').animate({height:'70px'},100,function(){
					$(this).animate({opacity:1},150);
				});
				$('form input').removeClass('error');
				$('div.error_content').hide();
			}
		});

		// Hide error_content
    $('div.error_content').delay(2000).fadeOut();

		// Forget password form
		$('form').submit(function(ev){
			var class_name = $('form a').attr('class');
			if (class_name == "login") {
				ev.preventDefault();
				// TODO ajax
				$('form input.login').addClass('disabled').val('Loading...');
				
				var email = $('form input[name="email"]').val();
				var params = {email:email};
				
				$.ajax({
	        dataType: 'json',
	        type: 'GET',
	        dataType: "text",
	        headers: {"cartodbclient": true},
	        url: global_api_url+'tables/', // INVENTADO
	        data: params,
	        success: function(data) {
	          $('form input.login').val('Email sent!').delay(2000).removeClass('disabled').val('Send email');
	        },
	        error: function(e, textStatus) {
						$('form input.login').removeClass('disabled').val('Send email');
						
						$('form input[name="email"]').addClass('error');
	          $('div.error_content p span').text('This email doesn\'t exist').closest('div').css('top','48px').fadeIn();
	        }
	      });
			} else if (class_name == "disabled") {
				ev.preventDefault();
			}
		});

		
  });