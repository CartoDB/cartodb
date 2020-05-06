class CommonDataSingleton
  include Singleton

  def initialize
    @common_data = nil
    @last_usage = Time.now
  end

  def datasets(visualizations_api_url)
    now = Time.now
    if @common_data.nil? || (now - @last_usage > (cache_ttl * 60))
      @common_data = CommonData.new(visualizations_api_url)
      @last_usage = now
    end
    @common_data.datasets
  end

  def cache_ttl
    Cartodb.get_config(:common_data, 'cache_ttl') || 0
  end
end
