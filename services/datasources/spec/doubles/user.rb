module CartoDB
  module Datasources
    module Doubles
      class User

        attr_accessor :twitter_datasource_enabled,
                      :soft_twitter_datasource_limit,
                      :twitter_datasource_quota,
                      :username,
                      :id

        def initialize(attrs = {})
          @twitter_datasource_enabled = attrs.fetch(:twitter_datasource_enabled, true)
          @soft_twitter_datasource_limit = attrs.fetch(:soft_twitter_datasource_limit, false)
          @twitter_datasource_quota = attrs.fetch(:twitter_datasource_quota, 123)
          @username = attrs.fetch(:username, 'wadus')
          @id = attrs.fetch(:id, '000-000')
          @organization = attrs.fetch(:has_org, false) \
            ? Organization.new({
              twitter_datasource_enabled: attrs.fetch(:org_twitter_datasource_enabled, true),
              twitter_datasource_quota: attrs.fetch(:org_twitter_datasource_quota, 123)
            }) \
            : nil
        end

        def organization
          @organization
        end

        def save
          self
        end

        def remaining_twitter_quota
          if @organization.nil?
            @twitter_datasource_quota
          else
            @organization.twitter_datasource_quota
          end
        end

      end
    end
  end
end
