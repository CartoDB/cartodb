module NavigationHelpers
  API_HOST = "http://api.localhost.lan"

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

  def superadmin_path
    "/superadmin"
  end

  def api_query_url
    "#{api_url_prefix}/"
  end

  def api_tables_url
    "#{api_url_prefix}/tables"
  end

  def api_table_url(table_identifier)
    "#{api_url_prefix}/tables/#{table_identifier}"
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

  private

  def api_url_prefix
    "#{API_HOST}/#{CartoDB::API::VERSION_1}"
  end

end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
