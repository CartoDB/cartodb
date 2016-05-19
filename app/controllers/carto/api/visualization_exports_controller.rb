# encoding: UTF-8

require_relative '../../../../lib/cartodb/event_tracker'

module Carto
  module Api
    class VisualizationExportsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include VisualizationsControllerHelper

      ssl_required :create, :show

      skip_before_filter :api_authorization_required, only: [:create, :show]
      before_filter :optional_api_authorization, only: [:create, :show]

      before_filter :load_visualization, only: :create
      before_filter :load_visualization_export, only: :show

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def create
        user = current_user ? Carto::User.find(current_user.id) : nil
        visualization_export = Carto::VisualizationExport.new(
          visualization: @visualization,
          user: user,
          user_tables_ids: params[:user_tables_ids])
        unless visualization_export.save
          if visualization_export.errors[:user].present?
            raise Carto::UnauthorizedError.new("Errors: #{visualization_export.errors.full_messages}")
          else
            CartoDB::Logger.warning(
              message: 'Validation error creating visualization export',
              user: user,
              visualization: @visualization.id,
              user_tables_ids: params[:user_tables_ids],
              visualization_export: visualization_export.inspect,
              error_messages: visualization_export.errors.full_messages
            )
            raise Carto::UnprocesableEntityError.new("Errors: #{visualization_export.errors.full_messages}")
          end
        end

        Resque.enqueue(Resque::ExporterJobs, job_id: visualization_export.id)

        render_jsonp(VisualizationExportPresenter.new(visualization_export).to_poro, 201)
 
        track_export_event(user, @visualization)
      end

      def show
        render_jsonp(VisualizationExportPresenter.new(@visualization_export).to_poro, 200)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]
        @visualization = Carto::Visualization.where(id: visualization_id).first
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def load_visualization_export
        id = uuid_parameter(:id)
        @visualization_export = Carto::VisualizationExport.where(id: id).first
        raise Carto::LoadError.new("Visualization export not found: #{id}") unless @visualization_export
        export_user_id = @visualization_export.user_id
        raise Carto::UnauthorizedError.new unless export_user_id.nil? || export_user_id == current_user.id
      end

      def track_export_event(user, vis)
        begin
          custom_properties = { privacy: vis.privacy,
                                type: vis.type,
                                vis_id: vis.id
                              }
          Cartodb::EventTracker.new.send_event(user, 'Exported map', custom_properties)
        rescue => e
          Rollbar.report_message('EventTracker: segment event tracking error', 
                                 'error', 
                                 { user_id: user_id, 
                                   event: 'Exported map',
                                   properties: custom_properties, 
                                   error_message: e.inspect
                                 })
        end
      end
    end
  end
end
