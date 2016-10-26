require 'hubspot/events_api'

module Carto
  module Tracking
    module Services
      module Hubspot
        def report_to_hubspot
          return unless ::Hubspot::EventsAPI.instance.enabled?

          hubspot_job = Resque::TrackingJobs::SendHubspotEvent
          supplied_properties = @format.to_hubspot

          Resque.enqueue(hubspot_job, id, supplied_properties)
        end
      end
    end
  end
end
