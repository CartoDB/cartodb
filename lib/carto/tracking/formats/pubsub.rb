module Carto
  module Tracking
    module Formats
      class PubSub

        def initialize(user: nil, visualization: nil, widget: nil, event_version: nil, hash: {})
          @user = user
          @visualization = visualization
          @widget = widget
          @event_version = event_version
          @import = hash[:connection]
          @origin = hash[:origin]
          @page = hash[:page]
          @quota_overage = hash[:quota_overage]
          @mapviews = hash[:mapviews]
          @analysis = hash[:analysis]
          @feature_flag = hash[:feature_flag]

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
                                               :analysis,
                                               :feature_flag)
        end

        def to_hash
          properties = event_properties

          properties.merge!(user_properties) if @user
          properties.merge!(visualization_properties) if @visualization
          properties.merge!(import_properties) if @import
          properties.merge!(trending_map_properties) if @mapviews
          properties.merge!(analysis_properties) if @analysis
          properties.merge!(widget_properties) if @widget
          properties.merge!(feature_flag_properties) if @feature_flag
          properties.merge!(@others) if @others

          properties[:page] = @page if @page
          properties[:quota_overage] = @quota_overage if @quota_overage

          properties
        end

        private

        def visualization_properties
          lifetime_in_days_with_decimals = days_with_decimals(now - @visualization.created_at)

          properties = {
            vis_id: @visualization.id,
            privacy: @visualization.privacy,
            vis_type: @visualization.type,
            object_created_at: @visualization.created_at,
            lifetime: lifetime_in_days_with_decimals
          }

          properties[:origin] = @origin if @origin

          properties
        end

        def user_properties
          {
            user_id: @user.id,
            event_source: @user.builder_enabled? ? 'builder' : 'editor',
            plan: @user.account_type,
            user_created_at: @user.created_at,
            organization: @user.organization&.name
          }
        end

        def import_properties
          connector = @import[:provider] || @import[:imported_from]

          {
            data_from: @import[:data_from],
            connector: connector,
            import_duration: @import[:import_time],
            data_size: @import[:data_size],
            sync_enabled: @import[:sync],
            error_code: @import[:error_code]
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

        def widget_properties
          { widget_type: @widget.type }
        end

        def feature_flag_properties
          {
            feature: @feature_flag[:feature],
            state: @feature_flag[:state]
          }
        end

        def event_properties
          domain = Cartodb.get_config(:session_domain)

          {
            event_time: now,
            source_domain: domain,
            event_version: @event_version
          }
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
