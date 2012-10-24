module Migrator

  module Layers

    module ClassMethods


      def migrate_layers
        puts 'layers'
      end

    end

    def self.included(base)
      base.extend(ClassMethods)
    end

  end

end
