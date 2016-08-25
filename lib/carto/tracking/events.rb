# encoding utf-8

require_dependency 'carto/tracking/formats/internal'
require_dependency 'carto/tracking/services/segment'

module Carto
  module Tracking
    module Events
      class Event
        def initialize(properties)
          @format = Carto::Tracking::Formats::Internal.new(properties)
        end

        def name
          self.class.name.demodulize.underscore.humanize.capitalize
        end

        def report
          check_required_properties!

          report_to_methods = methods.select do |method_name|
            method_name.to_s.start_with?('report_to')
          end

          report_to_methods.each do |report_method|
            send(report_method)
          end
        end

        def self.required_properties(required_properties)
          @required_properties ||= []
          @required_properties += required_properties
        end

        def required_properties
          self.class.instance_eval { @required_properties }
        end

        private

        def check_required_properties!
          missing_properties = required_properties - @format.to_hash.symbolize_keys.keys

          unless missing_properties.empty?
            message = "#{name} is missing the following properties: #{missing_properties.join(', ')}"

            raise Carto::UnprocesableEntityError.new(message)
          end
        end
      end

      class ExportedMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class CreatedMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class DeletedMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class PublishedMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class CompletedConnection < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id, :connection]
      end

      class FailedConnection < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id, :connection]
      end

      class ExceededQuota < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class ScoredTrendingMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :mapviews]
      end

      class VisitedPrivatePage < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :page]
      end

      class CreatedDataset < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class DeletedDataset < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id]
      end

      class LikedMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :visualization_id, :action]
      end
    end
  end
end
