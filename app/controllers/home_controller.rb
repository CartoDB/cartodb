# coding: UTF-8

class HomeController < ApplicationController

  skip_before_filter :browser_is_html5_compliant?, :only => :app_status

  layout 'front_layout'

  def index
    if logged_in?
      redirect_to dashboard_path and return
    else
      @user = User.new
    end
  end

  def app_status
    db_ok    = Rails::Sequel.connection.select('OK').first.values.include?('OK')
    redis_ok = $tables_metadata.dbsize
    api_ok   = true
    head (db_ok && redis_ok && api_ok) ? 200 : 500
  rescue
    Rails.logger.info "======== status method failed: #{$!}"
    head 500
  end

end
