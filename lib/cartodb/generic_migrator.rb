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
      $tables_metadata.hget(key(table), "migrated_to_#{@version}").to_s == "true"
    end

    def migrated!(table)
      @stats[:tables_migrated] += 1
      $tables_metadata.hset(key(table), "migrated_to_#{@version}", true)
    end

    def log msg
      @logger.debug(msg)
    end

    private
    def key(table)
      "rails:#{table.owner.database_name}:#{table.owner.database_schema}.#{table.name}")
    end
  end
end
