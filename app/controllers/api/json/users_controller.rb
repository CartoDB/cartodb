class Api::Json::UsersController < Api::ApplicationController

  if Rails.env.production?
    ssl_required :show
  end

  def show
  	user = User.filter({ :username => params[:id] }).first || User[params[:id]]
    
    data = {
    	:username => user.username,
    	:account_type => user.account_type,
    	:private_tables => user.private_tables_enabled,
    	:table_quota => user.table_quota,
    	:table_count => user.table_count,
    	:byte_quota => user.quota_in_bytes,
    	:remaining_table_quota => user.remaining_table_quota,
    	:remaining_byte_quota => user.remaining_quota.to_f,
    	:api_calls => (1..30).map{|i|i},
      :api_key => user.get_map_key
    }

    render :json => data
  end
end
