# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Log
        def initialize
          clear
        end

        def append(message)
          @log << message.to_s
        end

        def to_s
          @log
        end

        def clear
          @log = ''
        end

        def store
          nil
        end
      end
    end
  end
end
