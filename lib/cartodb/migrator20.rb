module CartoDB
  module DataMigrator

    def migrate!
      total_tables = @tables_to_migrate.count
      
      @tables_to_migrate.all.each_with_index do |table, index|
        if already_migrated?(table)
          @stats[:tables_skipped] += 1
          log "* Skipping: #{table.owner.username}/#{table.name} (id #{table.id})" rescue ''
        else
          begin
            log "* (#{index+1}/#{total_tables}) Migrating: #{table.owner.username}/#{table.name} id #{table.id}"

            log '  - Adding table_id'
            add_table_id(table)

            log '  - Creating default map and layers'
            table.create_default_map_and_layers if table.map.blank?
            table.reload

            log '  - Migrating map'
            migrate_table_map(table)

            log '  - Migrating layers'
            migrate_table_layers(table)
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
      log("- Bubble maps hacks:     #{@stats[:bubble_maps_hacks]}")
      log('- Tables with errors:')
      log("#{y(@stats[:tables_with_errors])}")
    end

    def add_table_id(table)
      if table.table_id.blank?
        table.this.update(:table_id => table.owner.in_database.select(:pg_class__oid)
          .from(:pg_class)
          .join_table(:inner, :pg_namespace, :oid => :relnamespace)
          .where(:relkind => 'r', :nspname => 'public', :relname => table.name)
          .first[:oid])
      end
    end

    def migrate_table_map(table)
      map_metadata = JSON.parse($tables_metadata.hget(key(table), 'map_metadata')) rescue {}
      map = table.map

      # All previous maps were based on google maps
      map.provider = 'googlemaps'

      # Copy center from redis, set map bounds if not set there
      if map_metadata['latitude'].blank? || map_metadata['longitude'].blank?
        bounds = map.recalculate_bounds!
      else
        map.center = "[#{map_metadata['latitude']},#{map_metadata['longitude']}]"
      end

      map.zoom = (map_metadata['zoom'].blank? ? 2 : map_metadata['zoom'])
      map.save
    end

    def migrate_table_layers(table)
      map_metadata = JSON.parse($tables_metadata.hget(key(table), 'map_metadata')) rescue {}
      infowindow_metadata = JSON.parse($tables_metadata.hget(key(table), 'infowindow')) rescue {}

      
      # Data layer setup
      data_layer = table.map.data_layers.first    

      data_layer.options['kind']       = 'carto'
      data_layer.options['table_name'] = table.name
      data_layer.options['user_name']  = table.owner.username

      # Try to read the legacy style for this table    
      if data_layer.options['legacy_tile_style'].blank?
        data_layer.options['legacy_tile_style'] = JSON.parse(
          $tables_metadata.get("map_style|#{table.owner.database_name}|#{table.name}")
        )['style'] rescue nil
      end

      # Send a style conversion request to the tiler
      conversion_cmd = "#{Rails.root.join('../../../node-windshaft/current/tools')}/convert_database_styles #{table.owner.database_name} #{table.name} 2.1.1"
      log('  - Converting table style to 2.1.1')
      `#{conversion_cmd}`
      log("    Conversion result: #{$?}")

      # Save the converted style on the model (reading it again from redis)
      new_tile_style = JSON.parse(
        $tables_metadata.get("map_style|#{table.owner.database_name}|#{table.name}")
      )['style'] rescue nil
      unless new_tile_style.blank?
        data_layer.options['tile_style'] = new_tile_style 
      end

      # First, try to read infowindow fields from Redis
      infowindow_fields = infowindow_metadata.select { |k,v| 
        v.to_s == 'true' && !(%w{created_at updated_at the_geom}.include?(k))
      }.map {|k,v| k }
      
      # Fill with default infowindow fields if we got nothing before
      if infowindow_fields.blank?
        infowindow_fields = table.schema(reload: true).map { |field| 
          unless %w{the_geom updated_at created_at}.include?(field.first.to_s.downcase) && !(field[1].to_s =~ /^geo/)
            field.first.to_s
          end
        }.compact 
      end

      # Remove all fields only when all fields have been marked as not included
      infowindow_fields = [] if (infowindow_metadata.present? && infowindow_metadata.all? { |k,v| v == false })

      data_layer.infowindow = {
        'fields'         => infowindow_fields
                              .each_with_index
                              .map { |column_name, i| { name: column_name, title: true, position: i+1 } },
        'template_name'  => 'infowindow_light'
      }

      data_layer.save

      # Base layer setup
      base_layer = table.map.base_layers.first

      base_layer.kind = 'gmapsbase'

      # Former satellite maps are now hybrid (satellite maps now don't show any labels)
      map_metadata['google_maps_base_type'] = 'hybrid' if map_metadata['google_maps_base_type'] == 'satellite'
      base_layer.options = {
        'style'     => map_metadata['google_maps_customization_style'],
        'base_type' => (map_metadata['google_maps_base_type'].blank? ? 'roadmap' : map_metadata['google_maps_base_type'])
      }
      base_layer.save
    end
  end

  private
  def key(table)
    "rails:#{table.owner.database_name}:#{table.owner.database_schema}.#{table.name}")
  end

end
