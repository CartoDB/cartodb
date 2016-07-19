module Carto
  module Tracking
    class SegmentWrapper
      def send_event(user, event_name, custom_properties = {})
        return unless segment_enabled?

        # Some events register custom properties
        # Monetary values associated with the event should use 'revenue' reserved key
        properties = event_properties(user).merge(custom_properties)

        Resque.enqueue(Resque::EventDeliveryJobs::TrackEvent, user.id, event_name, properties)
      end

      private

      def segment_enabled?
        segment_config = Cartodb.config[:segment]

        segment_config.present? && segment_config['api_key'].present?
      end

      def event_properties(user)
        {
          username: user.username,
          email: user.email,
          plan: user.account_type,
          organization: user.organization_user? ? user.organization.name : nil,
          event_origin: 'Editor',
          creation_time: Time.now.utc
        }
      end
    end
  end
end
