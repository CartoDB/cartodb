# encoding: utf-8

module Carto
  module Tracking
    module Formats
      class Segment
        def initialize(user: nil, visualization: nil, widget: nil, hash: {})
          @user = user
          @visualization = visualization
          @widget = widget
          @connection = hash[:connection]
          @origin = hash[:origin]
          @page = hash[:page]
          @quota_overage = hash[:quota_overage]
          @mapviews = hash[:mapviews]
          @action = hash[:action]
          @analysis = hash[:analysis]

          # add anything else as it arrives
          # add new properties in required_properties in events.rb for validation
          @others = hash.symbolize_keys.except(:visualization_id,
                                               :user_id,
                                               :widget_id,
                                               :connection,
                                               :origin,
                                               :page,
                                               :quota_overage,
                                               :mapviews,
                                               :action,
                                               :analysis)
        end

        def to_hash
          properties = event_properties

          properties.merge!(user_properties) if @user
          properties.merge!(visualization_properties) if @visualization
          properties.merge!(connection_properties) if @connection
          properties.merge!(map_liking_properties) if @action
          properties.merge!(trending_map_properties) if @mapviews
          properties.merge!(analysis_properties) if @analysis
          properties.merge!(widget_properties) if @widget
          properties.merge!(@others) if @others

          properties[:page] = @page if @page
          properties[:quota_overage] = @quota_overage if @quota_overage

          properties
        end

        private

        def visualization_properties
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
          user_created_at = @user.created_at
          user_age_in_days_with_decimals = days_with_decimals(now - user_created_at)

          {
            event_user_id: @user.id,
            event_origin: @user.builder_enabled? ? 'Builder' : 'Editor',
            plan: @user.account_type,
            user_active_for: user_age_in_days_with_decimals,
            user_created_at: user_created_at,
            organization: @user.organization_user? ? @user.organization.name : nil
          }
        end

        def connection_properties
          {
            data_from: @connection[:data_from],
            imported_from: @connection[:imported_from],
            sync: @connection[:sync] || false,
            file_type: @connection[:file_type]
          }
        end

        def analysis_properties
          {
            analysis_id: @analysis[:id],
            analysis_natural_id: @analysis[:natural_id],
            analysis_type: @analysis[:type]
          }
        end

        def trending_map_properties
          {
            map_id: @visualization.id,
            map_name: @visualization.name,
            mapviews: @mapviews
          }
        end

        def map_liking_properties
          visualization_user = @visualization.user

          {
            action: @action,
            vis_id: @visualization.id,
            vis_name: @visualization.name,
            vis_type: @visualization.type == 'derived' ? 'map' : 'dataset',
            vis_author_id: visualization_user.id
          }
        end

        def widget_properties
          { widget_type: @widget.type }
        end

        def event_properties
          { creation_time: now }
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
