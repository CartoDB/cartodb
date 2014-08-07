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
              type: CartoDB::Visualization::Member::CANONICAL_TYPE,
              description: table.description,
              tags: table.tags.to_s.split(','),
              privacy: (table.privacy == ::Table::PRIVACY_PUBLIC ? ::Table::PRIVACY_PUBLIC_TEXT : ::Table::PRIVACY_PRIVATE_TEXT)
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
      ::Table.db['delete from visualizations']
      ::Table.db['delete from overlays']
      ::Table.db['delete from layers_user_tables']
      # Remove redis keys
      @tables_to_migrate.all.each do |table|
        $tables_metadata.hdel(table.key, "migrated_to_#{@version}")
      end
    end

  end
end # CartoDB
