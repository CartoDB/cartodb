module Migrator

  module Maps

    module ClassMethods

      def migrate_maps
        puts 'maps'
      end

    end

    def self.included(base)
      base.extend(ClassMethods)
    end

  end

end
