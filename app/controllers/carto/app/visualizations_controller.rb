require_dependency 'carto/helpers/frame_options_helper'

module Carto
  module App
    class VisualizationsController < ApplicationController
      include Carto::FrameOptionsHelper

      ssl_required

      before_action :x_frame_options_allow, only: [:show, :show_protected]
      before_action :get_app

      skip_before_filter :verify_authenticity_token, only: [:show_protected]

      def show
        return app_password_protected if show_password?

        @source = HTMLAssetsService.instance.read_source_data(@app.asset)
        add_cache_headers
        render layout: false
      rescue StandardError => e
        log_error(exception: e)
        render_404
      end

      def show_protected
        submitted_password = params.fetch(:password, nil)
        return(render_404) unless @app.password_protected? && @app.has_password?

        unless @app.password_valid?(submitted_password)
          flash[:placeholder] = '*' * (submitted_password ? submitted_password.size : DEFAULT_PLACEHOLDER_CHARS)
          flash[:error] = "Invalid password"
          return app_password_protected
        end

        @source = HTMLAssetsService.instance.read_source_data(@app.asset)
        add_cache_headers

        render 'show', layout: false
      rescue StandardError => e
        log_error(exception: e)
        app_password_protected
      end

      private

      def show_password?
        return false if current_user && @app.has_read_permission?(current_user)

        @app.password_protected?
      end

      def get_app
        @app = Carto::Visualization.find(params[:id])
        if @app.nil?
          raise Carto::LoadError.new('App doesn\'t exist', 404)
        end
      end

      def app_password_protected
        render 'app_password', layout: 'application_password_layout'
      end

      def add_cache_headers
        response.headers['X-Cache-Channel'] = "#{@app.varnish_key}:vizjson"
        response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES} #{@app.surrogate_key}"
        response.headers['Cache-Control'] = "no-cache,max-age=86400,must-revalidate,public"
      end
    end
  end
end
