module Carto
  module Gme

    # TODO take care of these exceptions to provide better feedback to the user
    class ClientException < StandardError; end

    class Timeout < ClientException; end

    class HttpError < ClientException; end

    class OverQueryLimit < ClientException; end

    class ApiError < ClientException
      attr_reader :api_status, :error_message
      def initialize(api_status, error_message=nil)
        super(%Q{api_status = #{api_status}, error_message = "#{error_message}"})
        @api_status = api_status
        @error_message = error_message
      end
    end

  end
end
