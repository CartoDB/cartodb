# encoding: utf-8

module CartoDB
  module NamedMapsWrapper

    class NamedMapsGenericError < StandardError; end
    class NamedMapDataError < NamedMapsGenericError; end
    class NamedMapsDataError < NamedMapsGenericError; end
    class HTTPResponseError < NamedMapsGenericError; end

  end #NamedMapsWrapper
end #CartoDB