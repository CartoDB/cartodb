module AccountTypesHelper
  def create_account_type(account_type_name)
    rate_limit = Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([0, 1, 2]),
                                          maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                          maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                          maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                          maps_dataview_search: Carto::RateLimitValues.new([9, 10, 11]),
                                          maps_analysis: Carto::RateLimitValues.new([12, 13, 14]),
                                          maps_tile: Carto::RateLimitValues.new([15, 16, 17, 30, 32, 34]),
                                          maps_attributes: Carto::RateLimitValues.new([18, 19, 20]),
                                          maps_named_list: Carto::RateLimitValues.new([21, 22, 23]),
                                          maps_named_create: Carto::RateLimitValues.new([24, 25, 26]),
                                          maps_named_get: Carto::RateLimitValues.new([27, 28, 29]),
                                          maps_named: Carto::RateLimitValues.new([30, 31, 32]),
                                          maps_named_update: Carto::RateLimitValues.new([33, 34, 35]),
                                          maps_named_delete: Carto::RateLimitValues.new([36, 37, 38]),
                                          maps_named_tiles: Carto::RateLimitValues.new([39, 40, 41]),
                                          maps_analysis_catalog: Carto::RateLimitValues.new([1, 1, 1]),
                                          sql_query: Carto::RateLimitValues.new([0, 1, 2]),
                                          sql_query_format: Carto::RateLimitValues.new([3, 4, 5]),
                                          sql_job_create: Carto::RateLimitValues.new([6, 7, 8]),
                                          sql_job_get: Carto::RateLimitValues.new([9, 10, 11]),
                                          sql_job_delete: Carto::RateLimitValues.new([12, 13, 14]),
                                          sql_copy_from: Carto::RateLimitValues.new([1, 1, 60]),
                                          sql_copy_to: Carto::RateLimitValues.new([1, 1, 60]))

    account_type = Carto::AccountType.new
    account_type.rate_limit_id = rate_limit.id
    account_type.account_type = account_type_name || 'FREE'

    account_type.save! unless Carto::AccountType.exists?(account_type.account_type)
  end

  def create_account_type_fg(account_type)
    account_type ||= 'FREE'
    get_account_type(account_type) || new_account_type(account_type)
  end

  private

  def get_account_type(account_type)
    Carto::AccountType.find(account_type)
  rescue ActiveRecord::RecordNotFound
  end

  def new_account_type(account_type)
    if account_type == 'PRO'
      create(:account_type_pro)
    else
      create(:account_type, account_type: account_type)
    end
  end
end
