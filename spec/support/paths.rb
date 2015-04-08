module NavigationHelpers
  def homepage
    "/"
  end

  def login_path
    "#{CartoDB.hostname}/login"
  end

  def logout_path
    "/logout"
  end

  def dashboard_path
    "/dashboard"
  end

  def public_path
    "/dashboard/public"
  end  

  def api_query_url
    "#{api_url_prefix}/"
  end

  def api_tables_url(params = {})
     api_req "#{api_url_prefix}/tables#{params.empty? ? '' : '?' }#{params.to_query}"
  end

  def api_table_url(table_identifier, params = {})
    url = "#{api_url_prefix}/tables/#{table_identifier}"
    url = (url + ".#{params[:format]}") unless params[:format].blank?
    api_req(url)
  end
  
  def api_tags_url(params = {})
    api_req "#{api_url_prefix}/tables/tags"
  end
  
  def api_tables_tag_url(tag_name, params = {})
    api_req URI.encode("#{api_url_prefix}/tables/tags/#{tag_name}#{params.empty? ? '' : '?' }#{params.to_query}")
  end

  def api_table_records_url(table_identifier, params = {})
    api_req "#{api_url_prefix}/tables/#{table_identifier}/records#{params.empty? ? '' : '?' }#{params.to_query}"
  end

  def api_table_record_url(table_identifier, row_identifier, params = {})
    api_req "#{api_url_prefix}/tables/#{table_identifier}/records/#{row_identifier}#{params.empty? ? '' : '?' }#{params.to_query}"
  end

  def api_queries_url(params = {})
    api_req "#{api_url_prefix}/queries#{params.empty? ? '' : '?' }#{params.to_query}"
  end

  def api_table_columns_url(table_identifier)
    api_req "#{api_url_prefix}/tables/#{table_identifier}/columns"
  end

  def api_table_column_url(table_identifier, column_name)
    api_req "#{api_url_prefix}/tables/#{table_identifier}/columns/#{column_name}"
  end

  def api_table_record_column_url(table_identifier, row_identifier, column_name)
    api_req "#{api_url_prefix}/tables/#{table_identifier}/records/#{row_identifier}/columns/#{column_name}"
  end
  
  def api_user_url (user_id)
    api_req "#{api_url_prefix}/users/#{user_id}"
  end

  def superadmin_users_path
    "/superadmin/users"
  end

  def superadmin_user_path(user)
    "/superadmin/users/#{user.id}"
  end

  def api_imports_path(params = {})
    api_req "#{api_url_prefix}/tables/#{table_identifier}/export/shp"
  end
  
  private

  def api_url_prefix
    "#{CartoDB.hostname}/api/v1"
  end
  
  def api_key
    $users_metadata.HMGET("rails:users:test", 'map_key').first
  end  
  
  def api_req url
    url = Addressable::URI.parse(url)
    url.query_values = if url.query_values.nil?
      { :api_key => api_key }
    else
      url.query_values.merge({ :api_key => api_key })
    end
    url.to_s
  end  

end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
