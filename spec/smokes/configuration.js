var configuration = {}
var options       =  casper.cli.options

configuration.LOGIN_URL     = options['cartodb_login_url']
configuration.BASE_URL      = options['cartodb_base_url']
configuration.HOST          = options['cartodb_host']
configuration.SUBDOMAIN     = options['cartodb_subdomain']
configuration.API_KEY       = options['cartodb_api_key']
configuration.USER_EMAIL    = options['cartodb_user_email']
configuration.USER_PASSWORD = options['cartodb_user_password']
module.exports = configuration

