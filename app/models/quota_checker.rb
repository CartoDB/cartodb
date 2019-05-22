# encoding: utf-8

module CartoDB
  class QuotaChecker
    def initialize(user)
      @user = user
    end

    def will_be_over_table_quota?(number_of_new_tables)
      return false unless user.remaining_table_quota

      number_of_new_tables.to_i > user.remaining_table_quota.to_i
    end

    def over_table_quota?
      return false unless user.remaining_table_quota

      user.tables.count > user.table_quota.to_i
    end

    def will_be_over_public_map_quota?
      return false unless user.public_map_quota

      public_map_count >= user.public_map_quota
    end
      
    def will_be_over_regular_api_key_quota?
      return false unless user.regular_api_key_quota

      regular_api_key_count >= user.regular_api_key_quota
    end

    private

    def public_map_count
      not_private = [
        Carto::Visualization::PRIVACY_PUBLIC,
        Carto::Visualization::PRIVACY_LINK,
        Carto::Visualization::PRIVACY_PROTECTED
      ]

      query_builder = Carto::VisualizationQueryBuilder.new.
                      with_user_id(@user.id).
                      with_type(Carto::Visualization::TYPE_DERIVED).
                      with_privacy(not_private)
      query_builder.build.count
    end

    def regular_api_key_count
      user.api_keys.select { |api_key| api_key.type == Carto::ApiKey::TYPE_REGULAR }.count
    end

    attr_reader :user
  end
end
