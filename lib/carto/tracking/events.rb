require_dependency 'carto/tracking/segment_wrapper'

module Carto
  module Tracking
    module Events
      class MapExported
        EVENT_NAME = 'Exported map'.freeze

        def initialize(user_id, visualization_id)
          @user = Carto::User.find(user_id)
          @visualization = Carto::Visualization.find(visualization_id)
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(@user, properties)
        end

        private

        def properties
          { privacy: @visualization.privacy,
            type: @visualization.type,
            id: @visualization.id }
        end
      end
    end
  end
end
