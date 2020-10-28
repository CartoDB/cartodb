require_relative '../../lib/carto/http/client'
require_relative '../../services/sql-api/sql_api'
require_relative '../helpers/common_data_redis_cache'
require_relative '../../lib/carto_api/json_client'

class CommonData

  include ::LoggerHelper

  def initialize(visualizations_api_url)
    @datasets = nil
    @http_client = Carto::Http::Client.get('common_data', log_requests: true)
    @visualizations_api_url = visualizations_api_url
  end

  def datasets
    return @datasets unless @datasets.nil?

    @datasets = []

    if is_enabled?
      is_https_request = (@visualizations_api_url =~ /^https:\/\//)
      cached_data = redis_cache.get(is_https_request)
      if cached_data.nil?
        client = CartoAPI::JsonClient.new(http_client_tag: 'common_data')
        begin
          response = client.get_visualizations_v1_from_url(@visualizations_api_url)
          if response.code == 200
            @datasets = get_datasets(response.response_body)
            redis_cache.set(is_https_request, response.headers, response.response_body)
          else
            log_warning(message: "Error retrieving common data datasets", error_detail: response.inspect)
          end
        rescue StandardError => e
          log_error(exception: e)
        end
      else
        @datasets = get_datasets(cached_data[:body])
      end

      log_error(message: 'common-data empty', url: @visualizations_api_url) if @datasets.empty?
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
    rescue StandardError => e
      log_error(exception: e)
      rows = []
    end

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

  def export_url(table_name)
    query = %Q[select * from "#{table_name}"]
    sql_api_url(query, table_name, config('format', 'gpkg'))
  end

  def sql_api_url(query, filename, format)
    common_data_base_url = config('base_url')
    CartoDB::SQLApi.new({
      base_url: common_data_base_url,
      protocol: 'https',
      username: config('username'),
    }).url(query, format, filename)
  end

  def config(key, default = nil)
    Cartodb.get_config(:common_data, key) || default
  end

  def redis_cache
    @redis_cache ||= CommonDataRedisCache.new
  end
end
