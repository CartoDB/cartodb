require_relative '../../lib/carto/http/client'
require_relative '../../services/sql-api/sql_api'
require_relative '../helpers/common_data_redis_cache'

class CommonData

  # seconds
  CONNECT_TIMEOUT = 45
  DEFAULT_TIMEOUT = 60
  NO_PAGE_LIMIT = 100000

  def initialize(visualizations_api_url)
    @datasets = nil
    @http_client = Carto::Http::Client.get('common_data', log_requests: true)
    @visualizations_api_url = visualizations_api_url
  end

  def datasets

    if @datasets.nil?
      datasets = []
      if is_enabled?
        datasets = get_datasets(get_datasets_json)
      end
      @datasets = datasets
    end

    @datasets
  end

  def is_enabled?
    !config('username').nil?
  end

  private

  def get_datasets(json)
    begin
      rows = JSON.parse(json).fetch('visualizations', [])
    rescue => e
      CartoDB.notify_exception(e)
      rows = []
    end
    CartoDB.notify_error('common-data empty', { rows: rows, url: @visualizations_api_url}) if rows.nil? || rows.empty?

    datasets = []
    rows.each do |row|
      # Common-data's meta tables starts with meta_ and we want to avoid them
      next if row["name"] =~ /meta_/
      datasets << get_common_data_from_visualization(row)
    end
    datasets
  end

  def get_common_data_from_visualization(row)
      {
        "name" => row["name"],
        "display_name" => row["display_name"].nil? ? row["name"] : row["display_name"],
        "tabname" => row["name"],
        "attributions" => row["attributions"],
        "description" => row["description"],
        "source" => row["source"],
        "license" => row["license"],
        "tags" => row["tags"],
        "geometry_types" => %Q[{#{row["table"]["geometry_types"].join(',')}}],
        "rows" => row["table"]["row_count"],
        "size" => row["table"]["size"],
        "url" => export_url(row["name"]),
        "created_at" => row["created_at"],
        "updated_at" => row["updated_at"]
      }
  end

  def get_datasets_json
    body = nil
    begin
      http_client = Carto::Http::Client.get('common_data', log_requests: true)
      request = http_client.request(
        @visualizations_api_url,
        method: :get,
        connecttimeout: CONNECT_TIMEOUT,
        timeout: DEFAULT_TIMEOUT,
        params: {per_page: NO_PAGE_LIMIT}
      )
      is_https_request = (request.url =~ /^https:\/\//)
      cached_data = redis_cache.get(is_https_request)
      return cached_data[:body] unless cached_data.nil?
      response = request.run
      if response.code == 200
        body = response.response_body
        redis_cache.set(is_https_request, response.headers, response.response_body)
        body
      end
    rescue Exception => e
      CartoDB.notify_exception(e)
      body = nil
    end
    body
  end

  def export_url(table_name)
    query = %Q[select * from "#{table_name}"]
    sql_api_url(query, table_name, config('format', 'shp'))
  end

  def sql_api_url(query, filename, format)
    common_data_base_url = config('base_url')
    CartoDB::SQLApi.new({
      base_url: common_data_base_url,
      protocol: 'https',
      username: config('username'),
    }).url(query, format, filename)
  end

  def config(key, default=nil)
    if Cartodb.config[:common_data].present?
      Cartodb.config[:common_data][key].present? ? Cartodb.config[:common_data][key] : default
    else
      default
    end
  end

  def redis_cache
    @redis_cache ||= CommonDataRedisCache.new
  end
end
