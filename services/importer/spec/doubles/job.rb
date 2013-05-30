# encoding: utf-8

module CartoDB
  module Importer
    module Doubles
      class Job
        def initialize(*args); self; end
        def logger(*args); logger_fake; end
      
        private

        def logger_fake
          fake = Object.new
          def fake.log(*args); end
          fake
        end #logger_fake
      end # Job
    end # Doubles
  end # Importer
end # CartoDB

