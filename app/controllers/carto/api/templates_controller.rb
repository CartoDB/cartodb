module Carto
  module Api
    class TemplatesController < ::Api::ApplicationController

      ssl_required :index, :show, :create, :update, :destroy, :related_templates_by_visualization,
                   :related_templates_by_table
      before_filter :load_template, only: [ :show, :update, :destroy ]
      before_filter :check_feature_flag

      def index
        templates = Carto::Template.where(organization_id: current_user.organization_id)
                                   .order(:created_at)
                                   .reverse_order
                                   .all

        render_jsonp({ items: templates.map { |template| Carto::Api::TemplatePresenter.new(template).public_values } })
      rescue StandardError => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def show
        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue StandardError => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def create
        @stats_aggregator.timing('templates.create') do

          begin
            @template = Carto::Template.new({
                source_visualization_id:  params['source_visualization_id'],
                title:                    params['title'],
                description:              params.fetch('description', ''),
                min_supported_version:    params['min_supported_version'],
                max_supported_version:    params['max_supported_version'],
                code:                     params.fetch('code', ''),
                organization_id:          current_user.organization_id,
                required_tables:          params.fetch('required_tables', [])
              })

            result = @stats_aggregator.timing('save') do
              @template.save
            end

            render_jsonp({ :errors => ["#{@template.errors.messages.values.join(',')}"] }, 400) and return unless result

            render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
          rescue StandardError => e
            CartoDB.notify_exception(e)
            render json: { error: [e.message] }, status: 400
          end

        end
      end

      def update
        @stats_aggregator.timing('templates.update') do

          begin
            @template.title =                 params['title']
            @template.description =           params.fetch('description', '')
            @template.min_supported_version = params['min_supported_version']
            @template.max_supported_version = params['max_supported_version']
            @template.code =                  params.fetch('code', '')
            @template.required_tables =       params.fetch('required_tables', [])

            result = @stats_aggregator.timing('save') do
              @template.save
            end

            render_jsonp({ :errors => ["#{@template.errors.messages.values.join(',')}"] }, 400) and return unless result

            @template.reload

            render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
          rescue StandardError => e
            CartoDB.notify_exception(e)
            render json: { error: [e.message] }, status: 400
          end

        end
      end

      def destroy
        @stats_aggregator.timing('templates.destroy') do

          begin
            @stats_aggregator.timing('delete') do
              @template.delete
            end

            head :ok
          rescue StandardError => e
            CartoDB.notify_exception(e)
            render json: { error: [e.message] }, status: 400
          end

        end
      end


      def related_templates_by_visualization
        return head(400) if params[:id].nil?
        vis = Carto::Visualization.where(id: params[:id]).first
        return head(400) if vis.nil?

        templates = vis.related_templates

        render_jsonp({ items: templates.map { |template| Carto::Api::TemplatePresenter.new(template).public_values } })
      rescue StandardError => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def related_templates_by_table
        user_table = Carto::Helpers::TableLocator.new.get_by_id_or_name(params.fetch('id'), current_user)
        templates = user_table.service.related_templates

        render_jsonp(items: templates.map { |template| Carto::Api::TemplatePresenter.new(template).public_values })
      rescue StandardError => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      private

      def load_template
        @template = Carto::Template.where(id: params[:id]).first
        return render json: { errors: ["Template #{params[:id]} not found"] }, status: 404 if @template.nil?
      rescue StandardError => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def check_feature_flag
        unless current_user.has_feature_flag?('templated_workflows')
          render json: { error: "Endpoint disabled for this user" }, status: 403
        end
      end

    end
  end
end
