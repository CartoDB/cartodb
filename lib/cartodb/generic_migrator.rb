module CartoDB
  class GenericMigrator
    
    def initialize(version)
      @logger = ::Logger.new(STDOUT)
      @stats  = {
        tables_skipped:     0,
        tables_migrated:    0,
        tables_with_errors: {}
      }
      @tables_to_migrate = ::Table
      @version           = version.gsub(/\D/, '')

      require Rails.root.join("lib/cartodb/migrator#{@version}")
      self.class.send(:include, CartoDB::DataMigrator)
    end #initialize

    def already_migrated?(table)
      $tables_metadata.hget(table.key, "migrated_to_#{@version}").to_s == "true"
    end

    def migrated!(table)
      @stats[:tables_migrated] += 1
      $tables_metadata.hset(table.key, "migrated_to_#{@version}", true)
    end

    def log msg
      @logger.debug(msg)
    end
  end
end
