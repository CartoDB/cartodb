# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Log
        def initialize
          @log = ''
        end

        def append(message)
          @log << message.to_s
        end

        def to_s
          @log
        end
      end
    end
  end
end
