module Cartodb
  class EventTracker

    def track_exported_map(user, vis)
      if !vis.nil?
        custom_properties = { privacy: vis.privacy, type: vis.type, vis_id: vis.id }
        send_event(user, 'Exported map', custom_properties)
      else
        report_error('Exported map', user, type: 'Null visualization')
      end
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
      rescue => e
        report_error('Created dataset', user, type: 'Invalid import result', error: e.inspect)
      end

      # Generate an event if a map is imported as well
      begin
        if visualization_id
          vis = Carto::Visualization.where(id: visualization_id).first
          custom_properties = { privacy: vis.privacy, type: vis.type, vis_id: vis.id, origin: 'import' }
          send_event(user, 'Created map', custom_properties)
        end
      rescue => e
        report_error('Created map', user, type: 'Invalid import result', error: e.inspect)
      end
    end

    def send_event(user, event_name, custom_properties = {})
      return unless is_tracking_active?
      return unless user_valid?(user, event_name, custom_properties)

      # Some events register custom properties
      # Monetary values associated with the event should use 'revenue' reserved key
      properties = generate_event_properties(user).merge(custom_properties)

      Resque.enqueue(Resque::EventDeliveryJobs::TrackEvent, user.id, event_name, properties)
    end

    private

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

    def is_tracking_active?
      !Cartodb.config[:segment].blank? and !Cartodb.config[:segment]['api_key'].blank?
    end

    def user_valid?(user, event_name, custom_properties)
      if user.nil?
        report_error(event_name, user, type: 'Null user', properties: custom_properties)
        false
      else
        true
      end
    end

    def report_error(event, user, type: 'Unknown', properties: {}, error: nil)
      Rollbar.log('warning',
                  "EventTracker: #{type} error",
                  user_id: user.nil? ? nil : user.id,
                  event: event,
                  properties: properties,
                  error_message: error
                 )
    end
  end
end
