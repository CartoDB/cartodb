# encoding: UTF-8

require_relative '../../../models/carto/permission'
require_relative '../../../models/carto/user_table'

module Carto
  module Api
    class TablesController < ::Api::ApplicationController
      ssl_required :show, :create, :update

      before_filter :set_start_time

      before_filter :load_user_table, only: [:show, :update]
      before_filter :read_privileges?, only: [:show]
      before_filter :write_privileges?, only: [:update]

      def show
        table = @user_table.service
        render_jsonp(table.public_values({ request: request }, current_user).merge(schema: table.schema(reload: true)))
      end

      # Very basic controller method to simply make blank tables
      # All other table creation things are controlled via the imports_controller#create
      def create
        @stats_aggregator.timing('tables.create') do
          begin
            table = ::Table.new
            table.user_id = current_user.id

            tables = Carto::Db::UserSchema.new(current_user).table_names
            table.name = Carto::ValidTableNameProposer.new.propose_valid_table_name(params[:name], taken_names: tables)

            table.description    = params[:description]   if params[:description]
            table.the_geom_type  = params[:the_geom_type] if params[:the_geom_type]
            table.force_schema   = params[:schema]        if params[:schema]
            table.tags           = params[:tags]          if params[:tags]
            table.import_from_query = params[:from_query] if params[:from_query]

            save_status = @stats_aggregator.timing('save') do
              table.valid? && table.save
            end

            if save_status
              render_jsonp(table.public_values(request: request), 200, location: "/tables/#{table.id}")

              table_visualization = table.table_visualization
              if table_visualization
                current_viewer_id = current_viewer.id
                Carto::Tracking::Events::CreatedDataset.new(current_viewer_id,
                                                            visualization_id: table_visualization.id,
                                                            user_id: current_viewer_id,
                                                            origin: 'blank').report
              end
            else
              CartoDB::StdoutLogger.info 'Error on tables#create', table.errors.full_messages
              render_jsonp({ description: table.errors.full_messages, stack: table.errors.full_messages }, 400)
            end
          rescue CartoDB::QuotaExceeded
            current_viewer_id = current_viewer.id
            Carto::Tracking::Events::ExceededQuota.new(current_viewer_id,
                                                       user_id: current_viewer_id).report
            render_jsonp({ errors: ['You have reached your table quota'] }, 400)
          end

        end
      end

      def update
        table = @user_table.service
        @stats_aggregator.timing('tables.update') do
          begin
            warnings = []

            # Perform name validations
            # TODO move this to the model!
            # TODO consider removing this code. The entry point is only used to set lat/long columns
            unless params[:name].nil?
              new_name = params[:name].downcase
              if new_name != table.name
                # TODO reverse this logic: make explicit if this needs to start with a letter
                if params[:name] =~ /\A[0-9_]/
                  raise "Table names can't start with numbers or dashes."
                elsif current_user.tables.filter(:name.like(/\A#{params[:name]}/)).select_map(:name).include?(new_name)
                  raise "Table '#{new_name}' already exists."
                else
                  table.set_all(name: new_name)
                  @stats_aggregator.timing('save-name') do
                    table.save(:name)
                  end
                end
              end
            end

            # TODO: this is bad, passing all params blindly to the table object
            @user_table.assign_attributes(params.symbolize_keys.reject { |k, _| k == :name })
            if params.keys.include?('latitude_column') && params.keys.include?('longitude_column')
              latitude_column  = params[:latitude_column]  == 'nil' ? nil : params[:latitude_column].try(:to_sym)
              longitude_column = params[:longitude_column] == 'nil' ? nil : params[:longitude_column].try(:to_sym)
              @stats_aggregator.timing('georeference') do
                table.georeference_from!(latitude_column: latitude_column, longitude_column: longitude_column)
              end
              table.update_bounding_box
              render_jsonp(table.public_values(request: request).merge(warnings: warnings))
              return
            end

            update_status = @stats_aggregator.timing('save') do
              @user_table.save
            end

            if update_status != false
              render_jsonp(table.public_values(request: request).merge(warnings: warnings))
            else
              render_jsonp({ errors: table.errors.full_messages }, 400)
            end
          rescue => e
            CartoDB::StdoutLogger.info e.class.name, e.message
            render_jsonp({ errors: [translate_error(e.message.split("\n").first)] }, 400)
          end
        end
      end

      private

      def load_user_table
        @user_table = Carto::Helpers::TableLocator.new.get_by_id_or_name(params[:id], current_user)
        raise RecordNotFound unless @user_table
      end

      def read_privileges?
        head(403) unless current_user && @user_table.visualization.is_viewable_by_user?(current_user)
      end

      def write_privileges?
        head(401) unless current_user && @user_table.visualization.writable_by?(current_user)
      end
    end
  end
end
