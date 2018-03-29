module AccountTypesHelper
  def create_account_type(account_type_name)
    rate_limit = Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([2, 2, 1]),
                                          maps_static: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_static_named: Carto::RateLimitValues.new([2, 2, 1]),
                                          maps_dataview: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_dataview_search: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_analysis: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_tile: Carto::RateLimitValues.new([30, 30, 1, 75, 150, 60]),
                                          maps_attributes: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_named_list: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_named_create: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_named_get: Carto::RateLimitValues.new([4, 4, 1]),
                                          maps_named: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_named_update: Carto::RateLimitValues.new([2, 2, 1]),
                                          maps_named_delete: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_named_tiles: Carto::RateLimitValues.new([1, 1, 1]),
                                          maps_analysis_catalog: Carto::RateLimitValues.new([1, 1, 1]),
                                          sql_query: Carto::RateLimitValues.new([2, 2, 1]),
                                          sql_query_format: Carto::RateLimitValues.new([1, 1, 1]),
                                          sql_job_create: Carto::RateLimitValues.new([2, 2, 1]),
                                          sql_job_get: Carto::RateLimitValues.new([1, 1, 1]),
                                          sql_job_delete: Carto::RateLimitValues.new([1, 1, 1]))

    account_type = Carto::AccountType.new
    account_type.rate_limit_id = rate_limit.id
    account_type.account_type = account_type_name || 'FREE'

    account_type.save! unless Carto::AccountType.exists?(account_type.account_type)
  end
end
