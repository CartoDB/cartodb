# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Log
        def initialize(user)
          @user = user
          clear
        end

        # We wil ignore params in testing
        def append(message, truncate = nil, timestamp = nil)
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
      
        def user_id
          @user.id
        end
      end
    end
  end
end
