
module Carto
  module Api
    class ImageProxyController < ::Api::ApplicationController

      ssl_required :show

      def show
        # image url
        url = params[:url]
        render :status => 404 if url.blank?

        # fetch the image
        http_client = Carto::Http::Client.get('image_proxy', log_requests: true)
        response = http_client.get(url, followlocation: true,  timeout: 3)
        if response.code == 200
          send_data response.response_body, type: response.headers['Content-Type'], disposition: 'inline'
        else
          render :status => 404
        end

      end

    end
  end
end
