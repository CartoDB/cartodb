# encoding: utf-8

module CartoDB
  module Synchronizer
    module FileProviders
      class Base

        def get_new()
          raise "To be implemented in child classes"
        end

        private_class_method :new

      end # Base
    end #FileProviders
  end # Syncronizer
end # CartoDB

