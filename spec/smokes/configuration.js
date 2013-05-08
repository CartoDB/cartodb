var configuration = {}
var options       =  casper.cli.options

configuration.LOGIN_URL     = options['cartodb_login_url']
configuration.SUBDOMAIN     = options['cartodb_subdomain']
configuration.USER_EMAIL    = options['cartodb_user_email']
configuration.USER_PASSWORD = options['cartodb_user_password']
module.exports = configuration

