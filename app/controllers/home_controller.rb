# coding: UTF-8

class HomeController < ApplicationController
  layout 'front_layout'
  skip_before_filter :browser_is_html5_compliant?, :only => :app_status

  def app_status
    db_ok    = Rails::Sequel.connection.select('OK').first.values.include?('OK')
    redis_ok = $tables_metadata.dbsize
    api_ok   = true
    head (db_ok && redis_ok && api_ok) ? 200 : 500
  rescue => e
    CartoDB::Logger.info "status method failed", e.inspect      
    head 500
  end

end
