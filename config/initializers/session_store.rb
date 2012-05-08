# Be sure to restart your server when you modify this file.

CartoDB::Application.config.session_store :cookie_store, :key => '_cartodb_session', :domain => APP_CONFIG[:session_domain]
