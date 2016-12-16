# encoding: utf-8

require_dependency 'carto/tracking/formats/internal'
require_dependency 'carto/tracking/services/segment'
require_dependency 'carto/tracking/services/hubspot'
require_dependency 'carto/tracking/validators/visualization'
require_dependency 'carto/tracking/validators/user'

module Carto
  module Tracking
    module Events
      class Event
        def initialize(reporter_id, properties)
          @format = Carto::Tracking::Formats::Internal.new(properties)
          @reporter = Carto::User.find(reporter_id)
        end

        def name
          self.class.name.demodulize.underscore.humanize.capitalize
        end

        def report
          report!
        rescue => exception
          CartoDB::Logger.error(message: 'Carto::Tracking: Couldn\'t report event',
                                exception: exception,
                                name: name,
                                properties: @format.to_hash)
        end

        def report!
          check_required_properties!
          authorize!

          report_to_methods = methods.select do |method_name|
            method_name.to_s.start_with?('report_to')
          end

          report_to_methods.each do |report_method|
            send(report_method)
          end
        end

        def self.required_properties(*required_properties)
          @required_properties ||= []
          @required_properties += required_properties
        end

        def required_properties
          these_required_properties = self.class.instance_eval { @required_properties }

          these_required_properties || self.class.superclass.required_properties
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
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Readable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class MapEvent < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class CreatedMap < MapEvent; end
      class DeletedMap < MapEvent; end

      class PublishedMap < Event
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class ConnectionEvent < Event
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::User

        required_properties :user_id, :connection
      end

      class CompletedConnection < ConnectionEvent; end
      class FailedConnection < ConnectionEvent; end

      class ExceededQuota < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::User

        required_properties :user_id
      end

      class ScoredTrendingMap < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :mapviews
      end

      class VisitedPrivatePage < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::User

        required_properties :user_id, :page
      end

      class DatasetEvent < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class CreatedDataset < DatasetEvent; end
      class DeletedDataset < DatasetEvent; end

      class LikedMap < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Readable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :action
      end

      class AnalysisEvent < Event
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :analysis
      end

      class CreatedAnalysis < AnalysisEvent; end
      class ModifiedAnalysis < AnalysisEvent; end
      class DeletedAnalysis < AnalysisEvent; end

      class AppliedSql < Event
        include Carto::Tracking::Services::Hubspot

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class AppliedCartocss < Event
        include Carto::Tracking::Services::Hubspot

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class ModifiedStyleForm < Event
        include Carto::Tracking::Services::Hubspot

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class WidgetEvent < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :widget_id
      end

      class CreatedWidget < AnalysisEvent
        include Carto::Tracking::Validators::Widget::Existence
      end

      class ModifiedWidget < AnalysisEvent
        include Carto::Tracking::Validators::Widget::Existence
      end

      class DeletedWidget < AnalysisEvent
        include Carto::Tracking::Validators::Widget::NonExistence
      end
    end
  end
end
