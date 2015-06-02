require_relative '../../lib/carto/http_client'

class CommonData

  def initialize
    @datasets = nil
    @http_client = Carto::HttpClient.new('common_data')
  end

  def datasets
    if @datasets.nil?

      _datasets = DATASETS_EMPTY

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
      rows = JSON.parse(json).fetch('rows', [])
    rescue
      rows = []
    end

    _categories = {}
    _datasets = []

    rows.each { |row|
      category = row['category']
      unless _categories.has_key?(category)
        _categories[category] = {
            :name => category,
            :image_url => row['category_image_url'],
            :count => 0
        }
      end
      _categories[category][:count] += 1

      row.delete('category_image_url')
      row['url'] = export_url(row['tabname'])
      _datasets << row
    }

    {:datasets => _datasets, :categories => _categories.values}
  end

  def get_datasets_json
    body = nil
    begin
      response = @http_client.get(datasets_url, followlocation:true)
      if response.code == 200
        body = response.response_body
      end
    rescue
      body = nil
    end
    body
  end

  def datasets_url
    sql_api_url(DATASETS_QUERY, 'v1')
  end

  def export_url(table_name)
    "#{sql_api_url export_query(table_name)}&filename=#{table_name}&format=#{config('format', 'shp')}"
  end

  def sql_api_url(query, version='v2')
    "#{config('protocol', 'https')}://#{config('username')}.#{config('host')}/api/#{version}/sql?q=#{URI::encode query}"
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

  DATASETS_EMPTY = {
      :datasets => [],
      :categories => []
  }

  DATASETS_QUERY = <<-query
SELECT
  name,
  tabname,
  description,
  source,
  license,
  geometry_types,
  rows,
  size,
  created_at,
  updated_at,
  category,
  image_url
FROM CDB_CommonDataCatalog();
query

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
