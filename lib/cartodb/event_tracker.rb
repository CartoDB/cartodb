module Carto
  class SegmentWrapper
    def initialize(user_id)
      @user = Carto::User.find(user_id)
    end

    def track_exported_map(user, vis)
      return unless vis

      custom_properties = { privacy: vis.privacy, type: vis.type, vis_id: vis.id }
      send_event(user, 'Exported map', custom_properties)
    end

    def track_import(user, import_id, results, visualization_id, from_common_data)
      # Generate an event for every new imported dataset
      begin
        results.each do |result|
          if result.success?
            if !result.name.nil?
              user_table = UserTable.where(data_import_id: import_id, name: result.name).first
              origin = from_common_data ? 'common-data' : 'import'
            else
              user_table = UserTable.where(data_import_id: import_id).first
              origin = 'copy'
            end
            vis = Carto::Visualization.where(map_id: user_table.map_id).first
            custom_properties = { privacy: vis.privacy, type: vis.type, vis_id: vis.id, origin: origin }
            send_event(user, 'Created dataset', custom_properties)
          end
        end
      rescue => exception
        CartoDB::Logger.warning(message: 'SegmentWrapper',
                                event: 'created dataset',
                                type: 'Invalid import result',
                                exception: exception,
                                user: user)
      end

      # Generate an event if a map is imported as well
      begin
        if visualization_id
          vis = Carto::Visualization.where(id: visualization_id).first
          custom_properties = { privacy: vis.privacy, type: vis.type, vis_id: vis.id, origin: 'import' }
          send_event(user, 'Created map', custom_properties)
        end
      rescue => exception
        CartoDB::Logger.warning(message: 'SegmentWrapper',
                                event: 'created map',
                                type: 'Invalid import result',
                                exception: exception,
                                user: user)
      end
    end

    private

    def send_event(user, event_name, custom_properties = {})
      return unless tracking?
      return unless user

      # Some events register custom properties
      # Monetary values associated with the event should use 'revenue' reserved key
      properties = generate_event_properties(user).merge(custom_properties)

      Resque.enqueue(Resque::EventDeliveryJobs::TrackEvent, user.id, event_name, properties)
    end

    def generate_event_properties(user)
      {
        username: user.username,
        email: user.email,
        plan: user.account_type,
        organization: user.organization_user? ? user.organization.name : nil,
        event_origin: 'Editor',
        creation_time: Time.now.utc
      }
    end

    def tracking?
      Cartodb.config[:segment].present? && Cartodb.config[:segment]['api_key'].present?
    end

    def report_error(event, user, type: 'Unknown', properties: {}, exception: nil)
      CartoDB::Logger.warning(message: "EventTracker: #{type} error",
                              exception: error,
                              user: user
                              event: event,
                              properties: properties)
    end
  end
end
