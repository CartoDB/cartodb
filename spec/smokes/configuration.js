var configuration = {}
var options       =  casper.cli.options

configuration.LOGIN_URL     = options['cartodb_login_url']			// http://testuser.localhost.lan:3000
configuration.BASE_URL      = options['cartodb_base_url']			// http://testuser.localhost.lan:3000
configuration.HOST          = options['cartodb_host']				// testuser.localhost.lan:3000
configuration.SUBDOMAIN     = options['cartodb_subdomain']			// testuser
configuration.API_KEY       = options['cartodb_api_key']			// API key
configuration.USER_EMAIL    = options['cartodb_user_email']			// email
configuration.USER_PASSWORD = options['cartodb_user_password']		// password
module.exports = configuration
