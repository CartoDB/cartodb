# encoding utf-8

module Carto
  module Tracking
    module Formats
      class Segment
        def initialize(user: nil, visualization: nil, hash: {})
          @user = user
          @visualization = visualization
          @connection = hash[:connection]
          @origin = hash[:origin]
          @page = hash[:page]
          @quota_overage = hash[:quota_overage]
        end

        def properties
          properties = event_properties

          properties.merge!(user_properties) if @user
          properties.merge!(visualization_properties) if @visualization
          properties.merge!(connection_properties) if @connection

          properties[:page] = @page if @page
          properties[:quota_overage] = @quota_overage if @quota_overage

          properties
        end

        private

          def visualization_properties
            return {} unless @visualization

            created_at = @visualization.created_at
            lifetime_in_days_with_decimals = days_with_decimals(now - created_at)

            properties = {
              vis_id: @visualization.id,
              privacy: @visualization.privacy,
              type: @visualization.type,
              object_created_at: created_at,
              lifetime: lifetime_in_days_with_decimals
            }

            properties[:origin] = @origin if @origin

            properties
          end

          def user_properties
            return {} unless @user

            user_created_at = @user.created_at
            user_age_in_days_with_decimals = days_with_decimals(now - user_created_at)

            {
              username: @user.username,
              email: @user.email,
              plan: @user.account_type,
              user_active_for: user_age_in_days_with_decimals,
              user_created_at: user_created_at,
              organization: @user.organization_user? ? @user.organization.name : nil
            }
          end

          def connection_properties
            properties = {
              data_from: @connection[:data_from],
              imported_from: @connection[:imported_from],
              sync: @connection[:sync] || false
            }

            result = @connection[:result]
            properties[:file_type] = result.extension if result

            properties
          end

          def event_properties
            { event_origin: 'Editor', creation_time: now }
          end

          def days_with_decimals(time_object)
            time_object.to_f / 60 / 60 / 24
          end

          def now
            @now ||= Time.now.utc
          end
      end
    end
  end
end
