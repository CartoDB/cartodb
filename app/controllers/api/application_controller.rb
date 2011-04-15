# coding: UTF-8

class Api::ApplicationController < ApplicationController
  skip_before_filter :browser_is_html5_compliant?, :app_host_required, :verify_authenticity_token
  before_filter :api_authorization_required, :record_request
  after_filter :log_request
  
  protected
  
  # Record the request in the api threshold limiter. This are all the keys:
  #  - rails:users:<id>:requests:total
  #  - rails:users:<id>:requests:<date>
  #  - rails:users:<id>:requests:table:<table_name>:total
  #  - rails:users:<id>:requests:table:<table_name>:<date>
  #  - rails:users:<id>:requests:other:total
  #  - rails:users:<id>:requests:other:<date>
  # If the incoming request has a sql parameter with a query to execute, the names 
  # of the tables are extracted from the FROM statement. In other cases, the name
  # of the tables is extracted from the :table_id parameter
  def record_request
    tables = []
    if logged_in?
      $threshold.incr "rails:users:#{current_user.id}:requests:total"
      requests_today = $threshold.incr "rails:users:#{current_user.id}:requests:#{date}"
      # TODO: activate this limit
      # if requests_today > CartoDB::USER_REQUESTS_PER_DAY
      #   raise "You have reached the limit, time to pay!"
      # end
      if params[:sql] and params[:sql] =~ /from\s*([\w_]+)((\s*,\s*[\w_]+)*)\s*/i
        tables << $1
        unless $2.blank?
          $2.split(',').each do |raw_table|
            tables << raw_table.strip
          end
        end
      elsif params[:table_id]
        tables << params[:table_id].strip
      end
      if tables.empty?
        $threshold.incr "rails:users:#{current_user.id}:requests:other"
        other_requests_today = $threshold.incr "rails:users:#{current_user.id}:requests:#{date}"        
        # TODO: activate this limit
        # if other_requests_today > CartoDB::USER_REQUESTS_PER_DAY
        #   raise "You have reached the limit, time to pay!"
        # end        
      else
        tables.each do |table|
          $threshold.incr "rails:users:#{current_user.id}:requests:table:#{table.strip}:total"
          $threshold.incr "rails:users:#{current_user.id}:requests:table:#{table.strip}:#{date}"
        end
      end
    end
  end
  
  def log_request
    $queries_log.lpush "log-#{date}", request.remote_ip + '#' + (@to_log || "#{controller_name}##{action_name}")
  end
  
  def date
    Date.today.strftime("%Y-%m-%d")
  end
end