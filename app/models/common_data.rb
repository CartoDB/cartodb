require_relative '../../lib/carto/http/client'

class CommonData

  def initialize
    @datasets = nil
    @http_client = Carto::Http::Client.get('common_data', log_requests: true)
  end

  def datasets
    if @datasets.nil?

      _datasets = []

      if is_enabled?
        _datasets = get_datasets(get_datasets_json)
      end

      @datasets = _datasets
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
    CartoDB.notify_error('common-data empty', { rows: rows }) if rows.nil? || rows.empty?

    _datasets = []

    rows.each do |row|
      next if row["name"] =~ /meta_/
      _datasets << get_common_data_from_visualization(row)
    end

    _datasets
  end

  def get_common_data_from_visualization(row)
      row_data = {}
      row_data["name"] = row["name"]
      row_data["display_name"] = !row["display_name"].nil? ? row["display_name"] : row["name"]
      row_data["tabname"] = row["name"]
      row_data["description"] = row["description"]
      row_data["source"] = row["source"]
      row_data["license"] = row["license"]
      row_data["category"] = row["tags"]
      row_data["geometry_types"] = %Q[{#{row["table"]["geometry_types"].join(',')}}]
      row_data["rows"] = row["table"]["row_count"]
      row_data["size"] = row["table"]["size"]
      row_data["url"] = export_url(row["name"])
      row_data["created_at"] = row["created_at"]
      row_data["updated_at"] = row["updated_at"]
      row_data
  end

  def get_datasets_json
    body = nil
    begin
      http_client = Carto::Http::Client.get('common_data', log_requests: true)
      response = http_client.get(visualizations_datasets_url, followlocation:true)
      if response.code == 200
        body = response.response_body
      end
    rescue
      body = nil
    end
    body
  end

  def visualizations_datasets_url
    visualizations_api_url
  end

  def export_url(table_name)
    "#{sql_api_url export_query(table_name)}&filename=#{table_name}&format=#{config('format', 'shp')}"
  end

  def sql_api_url(query, version='v2')
    "#{config('protocol', 'https')}://#{config('username')}.#{config('host')}/api/#{version}/sql?q=#{URI::encode query}"
  end

  def visualizations_api_url(version='v1')
    "#{config('protocol', 'https')}://#{config('username')}.#{config('host')}/api/#{version}/viz?type=table&privacy=public"
  end

  def export_query(table_name)
    "select * from #{table_name}"
  end

  def config(key, default=nil)
    if Cartodb.config[:common_data].present?
      Cartodb.config[:common_data][key].present? ? Cartodb.config[:common_data][key] : default
    else
      default
    end
  end

end


class CommonDataSingleton
  include Singleton

  def initialize
    @common_data = CommonData.new
    @last_usage = Time.now
  end

  def datasets
    now = Time.now
    if now - @last_usage > (cache_ttl * 60)
      @common_data = CommonData.new
      @last_usage = now
    end
    @common_data.datasets
  end

  def cache_ttl
    ttl = 0
    if Cartodb.config[:common_data].present?
      ttl = Cartodb.config[:common_data]['cache_ttl'] || ttl
    end
    ttl
  end
end
