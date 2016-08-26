# encoding utf-8

require_dependency 'carto/tracking/formats/internal'
require_dependency 'carto/tracking/services/segment'
require_dependency 'carto/tracking/validators/visualization'
require_dependency 'carto/tracking/validators/user'

module Carto
  module Tracking
    module Events
      class Event
        def initialize(properties, current_viewer: nil)
          @format = Carto::Tracking::Formats::Internal.new(properties)
          @current_viewer = current_viewer
        end

        def name
          self.class.name.demodulize.underscore.humanize.capitalize
        end

        def report
          report!
        rescue => exception
          CartoDB::Logger.error(message: 'Carto::Tracking: Couldn\'t report event',
                                exception: exception)
        end

        def report!
          authorize! if @current_viewer
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

        def authorize!
          check_methods = methods.select do |method_name|
            method_name.to_s.start_with?('check_')
          end

          check_methods.each do |check_method|
            send(check_method)
          end
        end
      end

      class ExportedMap < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Readable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id]
      end

      class CreatedMap < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id]
      end

      class DeletedMap < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id]
      end

      class PublishedMap < Event
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Validators::Visualization::Writable

        required_properties [:user_id, :visualization_id]
      end

      class CompletedConnection < Event
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Validators::Visualization::Writable

        required_properties [:user_id, :visualization_id, :connection]
      end

      class FailedConnection < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id, :connection]
      end

      class ExceededQuota < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id]
      end

      class ScoredTrendingMap < Event
        include Carto::Tracking::Services::Segment

        required_properties [:user_id, :mapviews]
      end

      class VisitedPrivatePage < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::User

        required_properties [:user_id, :page]
      end

      class CreatedDataset < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id]
      end

      class DeletedDataset < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id]
      end

      class LikedMap < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Readable
        include Carto::Tracking::Validators::User

        required_properties [:user_id, :visualization_id, :action]
      end
    end
  end
end
