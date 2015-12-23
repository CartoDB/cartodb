# encoding: utf-8

module CartoDB
  module NamedMapsWrapper
    class NamedMapsGenericError < StandardError
      def initialize(message = "Named maps generic error", template_data = {})
        @template_data = template_data
        super(message)
      end

      attr_reader :template_data
    end

    class NamedMapDataError < NamedMapsGenericError; end
    class NamedMapsDataError < NamedMapsGenericError; end
    class HTTPResponseError < NamedMapsGenericError; end
    class NamedMapsPresenterError < NamedMapsGenericError; end
    class TooManyTemplatesError < NamedMapsGenericError; end
  end
end
