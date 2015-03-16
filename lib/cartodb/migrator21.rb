module CartoDB
  module DataMigrator

    def migrate!
      total_tables = @tables_to_migrate.count
      
      @tables_to_migrate.all.each_with_index do |table, index|
        if already_migrated?(table)
          @stats[:tables_skipped] += 1
          log "* Skipping: #{table.owner.username}/#{table.name} (id #{table.id})" rescue ''
        elsif table.table_visualization.present?
          @stats[:tables_skipped] += 1
          log "* Already has table visualization, skipping: #{table.owner.username}/#{table.name} (id #{table.id})" rescue ''
        else
          begin
            log "* (#{index+1}/#{total_tables}) Migrating: #{table.owner.username}/#{table.name} id #{table.id}"

            log '  - Adding visualization'
            CartoDB::Visualization::Member.new(
              name: table.name, 
              map_id: table.map_id, 
              type: CartoDB::Visualization::Member::TYPE_CANONICAL,
              description: table.description,
              tags: table.tags.to_s.split(','),
              privacy: (table.public? ? ::UserTable::PRIVACY_PUBLIC_TEXT : ::UserTable::PRIVACY_PRIVATE_TEXT)
            ).store

            migrated!(table)
          rescue => e
            log "!! Exception on #{table.name}\n#{e.inspect}"
            username = table.owner.username rescue ''
            @stats[:tables_with_errors][username] ||= []
            @stats[:tables_with_errors][username] << [table.name, e.inspect]
          end      
        end
      end

      log("\n=================================")
      log('Done!')
      log("- Tables processed:      #{total_tables}")
      log("- Tables migrated:       #{@stats[:tables_migrated]}")
      log("- Tables skipped:        #{@stats[:tables_skipped]}")
      log('- Tables with errors:')
      log("#{(@stats[:tables_with_errors])}")
    end

    def rollback!
      # Remove any visualizations and related data
      Sequel::Model.db['delete from visualizations']
      Sequel::Model.db['delete from overlays']
      Sequel::Model.db['delete from layers_user_tables']
      # Remove redis keys
      @tables_to_migrate.all.each do |table|
        $tables_metadata.hdel(key(table), "migrated_to_#{@version}")
      end
    end

    private
    def key(table)
      "rails:#{table.owner.database_name}:#{table.owner.database_schema}.#{table.name}")
    end
  end
end # CartoDB
