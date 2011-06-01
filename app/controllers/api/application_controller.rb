# coding: UTF-8

class Api::ApplicationController < ApplicationController
  skip_before_filter :browser_is_html5_compliant?, :app_host_required, :verify_authenticity_token
  before_filter :api_authorization_required
  # TO ACTIVATE when decided how to do it more efficiently without filling the Redis
  # after_filter :log_request
  
  protected

  # def log_request
  #   # $queries_log.lpush "log-#{Date.today.strftime("%Y-%m-%d")}", request.remote_ip + '#' + (@to_log || "#{controller_name}##{action_name}")
  # end
  
  def set_start_time
    @time_start = Time.now
  end
  
end