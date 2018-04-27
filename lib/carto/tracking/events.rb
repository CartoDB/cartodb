# encoding: utf-8

require_dependency 'carto/tracking/formats/internal'
require_dependency 'carto/tracking/services/segment'
require_dependency 'carto/tracking/services/hubspot'
require_dependency 'carto/tracking/validators/visualization'
require_dependency 'carto/tracking/validators/layer'
require_dependency 'carto/tracking/validators/user'
require_dependency 'carto/tracking/validators/widget'

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

        def self.required_properties(*required_properties)
          @required_properties ||= []
          @required_properties += required_properties
        end

        def required_properties
          these_required_properties = self.class.instance_eval { @required_properties || [] }

          these_required_properties + self.class.superclass.required_properties
        end

        def self.optional_properties(*optional_properties)
          @optional_properties ||= []
          @optional_properties += optional_properties
        end

        def optional_properties
          these_optional_properties = self.class.instance_eval { @optional_properties || [] }

          these_optional_properties + self.class.superclass.optional_properties
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
          check_no_extra_properties!
          authorize!

          report_to_methods = methods.select do |method_name|
            method_name.to_s.start_with?('report_to')
          end

          report_to_methods.each do |report_method|
            send(report_method)
          end
        end

        private

        def check_required_properties!
          missing_properties = required_properties - @format.to_hash.symbolize_keys.keys

          unless missing_properties.empty?
            message = "#{name} is missing the following properties: #{missing_properties.join(', ')}"

            raise Carto::UnprocesableEntityError.new(message)
          end
        end

        def check_no_extra_properties!
          extra_properties = @format.to_hash.symbolize_keys.keys - required_properties - optional_properties

          unless extra_properties.empty?
            message = "#{name} is adding the following extra properties: #{extra_properties.join(', ')}"

            raise Carto::UnprocesableEntityError.new(message)
          end
        end

        # Validators are modules that should be included in Event classes. These
        # modules contain methods that start with 'check_'. They raise an
        # exception if whatever condition they validate is not met. All methods
        # that match this criteria in validator modules included in an Event
        # class will be run automatically when .report or .report! is called for
        # that same class.
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

      class CreatedMap < MapEvent
        required_properties :origin
      end

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
        optional_properties :quota_overage
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

      class CreatedDataset < DatasetEvent
        required_properties :origin
      end

      class DeletedDataset < DatasetEvent; end

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

        required_properties :user_id, :visualization_id, :sql
        optional_properties :node_id, :dataset_id
      end

      class AppliedCartocss < Event
        include Carto::Tracking::Services::Hubspot

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :layer_id, :cartocss
      end

      class ModifiedStyleForm < AppliedCartocss
        required_properties :style_properties
      end

      class CreatedWidget < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Widget::Existence
        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :widget_id
      end

      class DownloadedLayer < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::Layer
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :layer_id, :format,
                            :source, :visible, :table_name

        optional_properties :from_view
      end

      class StyledByValue < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :attribute, :attribute_type
      end

      class DraggedNode < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class CreatedLayer < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::Layer
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :layer_id, :empty
      end

      class ChangedDefaultGeometry < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class AggregatedGeometries < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :previous_agg_type, :agg_type
      end

      class UsedAdvancedMode < Event
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :mode_type
      end

      # Models a generic event for segment.
      class SegmentEvent < Event
        include Carto::Tracking::Services::Segment

        attr_reader :name

        private_class_method :new

        # Just pass any hash at `properties` and it will be sent to Segment.
        def self.build(name, reporter_id, properties)
          new(name, reporter_id, properties) if EVENTS.include?(name)
        end

        private

        EVENTS = ['WebGL stats'].freeze

        def initialize(name, reporter_id, properties)
          @name = name
          @properties = properties
          @format = SegmentFormat.new(@properties)
          @reporter = Carto::User.where(id: reporter_id).first
        end
      end

      class SegmentFormat < Carto::Tracking::Formats::Internal
        def to_segment
          data = super
          data[:data_properties] = to_hash
          data
        end
      end
    end
  end
end
