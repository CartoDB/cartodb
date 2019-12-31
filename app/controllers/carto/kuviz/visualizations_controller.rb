require_dependency 'carto/helpers/frame_options_helper'

module Carto
  module Kuviz
    class VisualizationsController < ApplicationController
      include Carto::FrameOptionsHelper

      ssl_required

      before_action :x_frame_options_allow, only: [:show, :show_protected]
      before_action :get_kuviz
      before_action :count_visit

      skip_before_filter :verify_authenticity_token, only: [:show_protected]

      def show
        return kuviz_password_protected if @kuviz.password_protected?

        @source = KuvizAssetsService.instance.read_source_data(@kuviz.asset)
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

        @source = KuvizAssetsService.instance.read_source_data(@kuviz.asset)
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

      def count_visit
        return unless @kuviz

        redis_key = CartoDB::Stats::APICalls.new.redis_api_call_key(@kuviz.user.username, 'mapviews', @kuviz.id)
        $users_metadata.ZINCRBY(redis_key, 1, Time.now.strftime("%Y%m%d"))
      end
    end
  end
end
