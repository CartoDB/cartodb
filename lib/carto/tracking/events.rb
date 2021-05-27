require 'carto/tracking/services/pubsub_tracker'

require_dependency 'carto/tracking/formats/internal'
require_dependency 'carto/tracking/services/pubsub'
require_dependency 'carto/tracking/services/segment'
require_dependency 'carto/tracking/services/hubspot'
require_dependency 'carto/tracking/validators/visualization'
require_dependency 'carto/tracking/validators/layer'
require_dependency 'carto/tracking/validators/user'
require_dependency 'carto/tracking/validators/widget'

#  IMPORTANT: Events must be kept in sync with frontend!
#  See `/lib/assets/javascripts/builder/components/metrics/metrics-types.js`

DEFAULT_EVENT_VERSION = 1

module Carto
  module Tracking
    module Events
      class Event
        include ::LoggerHelper

        def initialize(reporter_id, properties)
          properties.merge!({event_version: event_version})

          @format = Carto::Tracking::Formats::Internal.new(properties)
          @reporter = Carto::User.find(reporter_id || properties[:user_id])
        end

        def name
          self.class.name.demodulize.underscore.humanize.capitalize
        end

        def event_version
          DEFAULT_EVENT_VERSION
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
          @optional_properties += [:event_version]
        end

        def optional_properties
          these_optional_properties = self.class.instance_eval { @optional_properties || [] }

          these_optional_properties + self.class.superclass.optional_properties
        end

        def report
          report!
        rescue StandardError => e
          log_error(
            message: 'Carto::Tracking: Error reporting event',
            exception: e,
            event: @format.to_hash.merge(name: name)
          )
        end

        def report!
          check_required_properties!
          check_no_extra_properties!
          authorize!

          # NOTE: beware of this metaprogramming piece when browsing
          # the code
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
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::Visualization::Readable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id

        def pubsub_name
          'map_exported'
        end

        def event_version
          2
        end
      end

      class MapEvent < Event
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class CreatedMap < MapEvent
        include Carto::Tracking::Services::Hubspot

        required_properties :origin
        optional_properties :connection

        def pubsub_name
          'map_created'
        end

        def event_version
          3
        end
      end

      class DeletedMap < MapEvent
        def pubsub_name
          'map_deleted'
        end

        def event_version
          2
        end
      end

      class ModifiedMap < MapEvent
        def pubsub_name
          'map_updated'
        end

        def event_version
          2
        end
      end

      class PublishedMap < Event
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id

        def pubsub_name
          'map_published'
        end

        def event_version
          2
        end
      end

      class ConnectionEvent < Event
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment

        include Carto::Tracking::Validators::User

        required_properties :user_id, :connection
      end

      class CompletedConnection < ConnectionEvent; end

      class FailedConnection < ConnectionEvent
        include Carto::Tracking::Services::PubSub

        def pubsub_name
          'import_failed'
        end

        def event_version
          3
        end
      end

      class FailedSync < Event
        include Carto::Tracking::Services::PubSub

        required_properties :user_id, :connection

        def pubsub_name
          'sync_failed'
        end
      end

      class ExceededQuota < Event
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::User

        required_properties :user_id
        optional_properties :quota_overage

        def pubsub_name
          'quota_exceeded'
        end
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

        def report_to_user_model
          @format.fetch_record!(:user).view_dashboard if @format.to_hash['page'] == 'dashboard'
        end
      end

      class DatasetEvent < Event
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id
      end

      class CreatedDataset < DatasetEvent
        include Carto::Tracking::Services::Hubspot

        required_properties :origin
        optional_properties :connection

        def pubsub_name
          'dataset_created'
        end

        def event_version
          3
        end
      end

      class DeletedDataset < DatasetEvent
        def pubsub_name
          'dataset_deleted'
        end

        def event_version
          2
        end
      end

      class AnalysisEvent < Event
        include Carto::Tracking::Services::Hubspot
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::Visualization::Writable
        include Carto::Tracking::Validators::User

        required_properties :user_id, :visualization_id, :analysis
      end

      class CreatedAnalysis < AnalysisEvent
        def pubsub_name
          'analysis_created'
        end
      end

      class ModifiedAnalysis < AnalysisEvent
        def pubsub_name
          'analysis_updated'
        end
      end

      class DeletedAnalysis < AnalysisEvent
        def pubsub_name
          'analysis_deleted'
        end
      end

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

      class OauthAppEvent < Event
        include Carto::Tracking::Services::Segment
        include Carto::Tracking::Services::PubSub

        include Carto::Tracking::Validators::User

        required_properties :user_id, :app_id, :app_name
      end

      class CreatedOauthApp < OauthAppEvent
        def pubsub_name
          'oauth_app_created'
        end
      end

      class DeletedOauthApp < OauthAppEvent
        def pubsub_name
          'oauth_app_deleted'
        end
      end

      class CreatedOauthAppUser < OauthAppEvent
        def pubsub_name
          'oauth_app_user_created'
        end
      end

      class DeletedOauthAppUser < OauthAppEvent
        def pubsub_name
          'oauth_app_user_deleted'
        end
      end

      class UpdatedFeatureFlag < Event
        include Carto::Tracking::Services::PubSub

        required_properties :user_id, :feature_flag

        def pubsub_name
          'feature_flag_updated'
        end
      end

      class DoFullAccessAttempt < Event
        include Carto::Tracking::Services::PubSub
        include Carto::Tracking::Validators::User

        required_properties :user_id, :dataset_id, :db_type, :license_type

        def pubsub_name
          'do_full_access_attempt'
        end
      end

      class DoFullAccessRequest < Event
        include Carto::Tracking::Services::PubSub
        include Carto::Tracking::Validators::User

        required_properties :user_id, :dataset_id, :db_type

        def pubsub_name
          'do_full_access_request'
        end
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
