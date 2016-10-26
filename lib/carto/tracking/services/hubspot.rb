require 'hubspot/events_api'

module Carto
  module Tracking
    module Services
      module Hubspot
        def report_to_hubspot
          return unless ::Hubspot::EventsAPI.instance.enabled?

          hubspot_job = Resque::TrackingJobs::SendHubspotEvent
          supplied_properties = @format.to_hubspot
          event_name = name.downcase.tr(' ', '_')
          id = Cartodb.get_config(:metrics, 'hubspot', 'event_ids')[event_name]

          if id.present?
            Resque.enqueue(hubspot_job, id, supplied_properties)
          else
            message = 'Carto::Tracking: Hubspot event id not configured'
            CartoDB::Logger.error(message: message, event_name: event_name)
          end
        end
      end
    end
  end
end
