module Carto
  module Tracking
    class SegmentWrapper
      def send_event(user, name, properties = {})
        return unless segment_enabled?

        Resque.enqueue(Resque::EventDeliveryJobs::TrackEvent, user ? user.id : nil, name, properties)
      end

      private

      def segment_enabled?
        segment_config = Cartodb.config[:segment]

        segment_config.present? && segment_config['api_key'].present?
      end
    end
  end
end
