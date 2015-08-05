#encoding: UTF-8

module Carto
  module Api
    class TemplatesController < ::Api::ApplicationController

      ssl_required :index, :show, :create, :update, :destroy
      before_filter :load_template, only: [ :show, :update, :destroy ]
      before_filter :check_feature_flag

      def index
        templates = Carto::Template.where(organization_id: current_user.organization_id)
                                   .order(:created_at)
                                   .reverse_order
                                   .all

        render_jsonp({ items: templates.map { |template| Carto::Api::TemplatePresenter.new(template).public_values } })
      rescue => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def show
        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def create
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

        result = @template.save
        render_jsonp({ :errors => ["#{@template.errors.messages.values.join(',')}"] }, 400) and return unless result

        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def update
        @template.title =                 params['title']
        @template.description =           params.fetch('description', '')
        @template.min_supported_version = params['min_supported_version']
        @template.max_supported_version = params['max_supported_version']
        @template.code =                  params.fetch('code', '')
        @template.required_tables =       params.fetch('required_tables', [])

        result = @template.save
        render_jsonp({ :errors => ["#{@template.errors.messages.values.join(',')}"] }, 400) and return unless result

        @template.reload

        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      def destroy
        @template.delete

        head :ok
      rescue => e
        CartoDB.notify_exception(e)
        render json: { error: [e.message] }, status: 400
      end

      private

      def load_template
        @template = Carto::Template.where(id: params[:id]).first
        return render json: { errors: ["Template #{params[:id]} not found"] }, status: 404 if @template.nil?
      rescue => e
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
