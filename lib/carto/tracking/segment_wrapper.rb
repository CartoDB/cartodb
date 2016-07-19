module Carto
  module Tracking
    class SegmentWrapper
      def initialize(user)
        @user = user
      end

      def send_event(event_name, custom_properties = {})
        return unless segment_enabled?

        # Some events register custom properties
        # Monetary values associated with the event should use 'revenue' reserved key
        properties = event_properties.merge(custom_properties)

        Resque.enqueue(Resque::EventDeliveryJobs::TrackEvent, @user.id, event_name, properties)
      end

      private

      def event_properties
        {
          username: @user.username,
          email: @user.email,
          plan: @user.account_type,
          organization: @user.organization_user? ? @user.organization.name : nil,
          event_origin: 'Editor',
          creation_time: Time.now.utc
        }
      end

      def segment_enabled?
        carto_config = Cartodb.config

        @segment_enabled ||= (carto_config[:segment].present? && carto_config[:segment]['api_key'].present?)
      end
    end
  end
end
