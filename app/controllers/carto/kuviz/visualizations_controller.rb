module Carto
  module Kuviz
    class VisualizationsController < ApplicationController

      ssl_required

      before_action :get_kuviz
      skip_before_filter :verify_authenticity_token, only: [:show_protected]

      def show
        return kuviz_password_protected if @kuviz.password_protected?
        @source = KuvizAssetsService.instance.read_source_data(@kuviz)
        add_cache_headers
        render layout: false
      rescue StandardError => e
        CartoDB::Logger.error(exception: e)
        render_404
      end

      def show_protected
        submitted_password = params.fetch(:password, nil)
        return(render_404) unless @kuviz.password_protected? && @kuviz.has_password?

        unless @kuviz.password_valid?(submitted_password)
          flash[:placeholder] = '*' * (submitted_password ? submitted_password.size : DEFAULT_PLACEHOLDER_CHARS)
          flash[:error] = "Invalid password"
          return kuviz_password_protected
        end

        @source = KuvizAssetsService.instance.read_source_data(@kuviz)
        add_cache_headers

        render 'show', layout: false
      rescue StandardError => e
        CartoDB::Logger.error(exception: e)
        kuviz_password_protected
      end

      private

      def get_kuviz
        @kuviz = Carto::Visualization.find(params[:id])
        if @kuviz.nil?
          raise Carto::LoadError.new('Kuviz doesn\'t exist', 404)
        end
      end

      def kuviz_password_protected
        render 'kuviz_password', layout: 'application_password_layout'
      end

      def add_cache_headers
        response.headers['X-Cache-Channel'] = "#{@kuviz.varnish_key}:vizjson"
        response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES} #{@kuviz.surrogate_key}"
        response.headers['Cache-Control'] = "no-cache,max-age=86400,must-revalidate,public"
      end
    end
  end
end
