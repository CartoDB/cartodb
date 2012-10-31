class Migrator20

  def migrate!
    @logger = Logger.new(STDOUT)
    @tables_skipped     = 0
    @tables_migrated    = 0
    @tables_with_errors = {}

    Table.select(:id, :database_name, :name, :user_id).all.each do |table|
      if already_migrated?(table)
        log "* Skipping: #{table.name}"
        @tables_skipped += 1
      else
        begin
          log "* Migrating: #{table.name}"

          log "  - Adding table_id"
          add_table_id(table)

          log "  - Creating default map and layers"
          table.create_default_map_and_layers if table.map.blank?
          table.reload

          log "  - Migrating map"
          migrate_table_map(table)

          log "  - Migrating layers"
          migrate_table_layers(table)
          migrated!(table)
        rescue => e
          log "!! Exception on #{table.name}\n#{e.inspect}"
          username = table.owner.username rescue ""
          @tables_with_errors[username] ||= []
          @tables_with_errors[username] << table.name
        end      
      end
    end

    log("\n=================================")
    log("Done!")
    log("- Tables migrated:       #{@tables_migrated}")
    log("- Tables skipped:        #{@tables_skipped}")
    log("- Tables with errors:")
    log("#{y(@tables_with_errors)}")
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
    map_metadata = JSON.parse($tables_metadata.hget(table.key, 'map_metadata')) rescue {}
    map = table.map

    # All previous maps were based on google maps
    map.provider = "googlemaps"
    map.center = (map_metadata["latitude"].blank? ? "[0, 0]" : "[#{map_metadata["latitude"]},#{map_metadata["longitude"]}]")
    map.zoom = (map_metadata["zoom"].blank? ? 2 : map_metadata["zoom"])
    map.save
  end

  def migrate_table_layers(table)
    map_metadata = JSON.parse($tables_metadata.hget(table.key, 'map_metadata')) rescue {}
    infowindow_metadata = JSON.parse($tables_metadata.hget(key, 'infowindow')) rescue {}

    
    # Data layer setup
    data_layer = table.map.data_layers.first    

    data_layer.options               = data_layer.options.except('style_version')
    data_layer.options['kind']       = 'carto'
    data_layer.options["table_name"] = table.name
    data_layer.options["user_name"]  = table.owner.username
    data_layer.options['tile_style'] = JSON.parse(
      $tables_metadata.get("map_style|#{table.database_name}|#{table.name}")
    )['style'] rescue nil

    infowindow_fields = infowindow_metadata.select { |k,v| v.to_s == "true" && !['created_at', 'updated_at', 'the_geom'].include?(k) }
    infowindow_fields = table.schema(reload: true).map { |i| i.first }.select { |k, v|
      !["the_geom", "updated_at", "created_at"].include?(k.to_s.downcase)
    } if infowindow_fields.blank?
    data_layer.infowindow = {
      "fields"         => infowindow_fields
                            .each_with_index
                            .map { |column_name, i| { name: column_name, title: true, position: i+1 } },
      "template_name"  => "table/views/infowindow_light"
    }
    data_layer.save


    # Base layer setup
    base_layer = table.map.base_layers.first

    base_layer.kind = 'gmapsbase'
    base_layer.options = {
      'style'     => map_metadata["google_maps_customization_style"],
      'base_type' => (map_metadata["google_maps_base_type"].blank? ? 'roadmap' : map_metadata["google_maps_base_type"])
    }
    base_layer.save
  end

  def already_migrated?(table)
    $tables_metadata.hget(table.key, 'migrated_to_20').to_s == "true"
  end

  def migrated!(table)
    @tables_migrated += 1
    $tables_metadata.hset(table.key, 'migrated_to_20', true)
  end

  def log msg
    @logger.debug(msg)
  end

end
