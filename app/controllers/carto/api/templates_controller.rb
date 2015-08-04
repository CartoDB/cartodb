#encoding: UTF-8

module Carto
  module Api
    class TemplatesController < ::Api::ApplicationController

      ssl_required :index, :show, :create, :update, :destroy
      before_filter :load_template, only: [ :show, :update, :destroy ]

      def index
        templates = Carto::Template.where(organization_id: current_user.organization_id).order(:created_at).reverse

        render_jsonp({ items: templates.map { |template| Carto::Api::TemplatePresenter.new(template).public_values } })
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

      def show
        render_jsonp({ :errors => ["Template #{params[:id]} not found"] }, 404) and return if @template.nil?

        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

      def create
        @template = Carto::Template.new({
            source_visualization_id:  params[:source_visualization_id],
            title:                    params[:title],
            description:              params.fetch(:description, ''),
            min_supported_version:    params[:min_supported_version],
            max_supported_version:    params[:max_supported_version],
            code:                     params.fetch(:code, ''),
            organization_id:          current_user.organization_id,
            required_tables_list:     params.fetch(:required_tables_list, [])
          })

        result = @template.save
        render_jsonp({ :errors => ["#{@template.errors.messages.values.join(',')}"] }, 400) and return unless result

        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

      def update
        render_jsonp({ :errors => ["Template #{params[:id]} not found"] }, 404) and return if @template.nil?

        @template.title =                 params[:title]
        @template.description =           params.fetch(:description, '')
        @template.min_supported_version = params[:min_supported_version]
        @template.max_supported_version = params[:max_supported_version]
        @template.code =                  params.fetch(:code, '')
        @template.required_tables_list =  params.fetch(:required_tables_list, [])

        result = @template.save
        render_jsonp({ :errors => ["#{@template.errors.messages.values.join(',')}"] }, 400) and return unless result

        @template.reload

        render_jsonp(Carto::Api::TemplatePresenter.new(@template).public_values)
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

      def destroy
        render_jsonp({ :errors => ["Template #{params[:id]} not found"] }, 404) and return if @template.nil?

        @template.delete

        head :ok
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

      private

      def load_template
        @template = Carto::Template.where(id: params[:id]).first
      rescue
        @template = nil
      end

    end
  end
end
