module NavigationHelpers
  def homepage
    "/"
  end

  def login_path
    "/login"
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
    "#{api_url_prefix}/tables#{params.empty? ? '' : '?' }#{params.to_query}"
  end

  def api_table_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}"
  end
  
  def api_tags_url(params = {})
    "#{api_url_prefix}/tables/tags"
  end
  
  def api_tables_tag_url(tag_name, params = {})
    URI.encode "#{api_url_prefix}/tables/tags/#{tag_name}#{params.empty? ? '' : '?' }#{params.to_query}"
  end

  def api_table_records_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}/records"
  end

  def api_table_record_url(table_identifier, row_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}/records/#{row_identifier}"
  end

  def api_table_columns_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}/columns"
  end

  def api_table_column_url(table_identifier, column_name)
    "#{api_url_prefix}/tables/#{table_identifier}/columns/#{column_name}"
  end

  def api_table_record_column_url(table_identifier, row_identifier, column_name)
    "#{api_url_prefix}/tables/#{table_identifier}/records/#{row_identifier}/columns/#{column_name}"
  end
  
  def api_table_records_pending_addresses_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}/records/pending_addresses"
  end
  
  def api_table_export_to_csv_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}/export/csv"
  end

  def api_table_export_to_shp_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}/export/shp"
  end

  def superadmin_users_path
    "/superadmin/users"
  end

  def superadmin_user_path(user)
    "/superadmin/users/#{user.id}"
  end
  
  private

  def api_url_prefix
    "#{CartoDB.hostname}/api/#{CartoDB::API::VERSION_1}"
  end

end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
