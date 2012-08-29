require 'mustache/js'
require 'tilt/mustache_js_template'

Rails.application.assets.register_engine '.mustache', Tilt::MustacheJsTemplate
