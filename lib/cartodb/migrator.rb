class Migrator

  def migrate!
    Table.select(:id, :database_name, :name, :user_id).all.each do |table|
      if already_migrated?(table)
        puts "* Skipping: #{table.name}"
      else
        begin
          puts "* Migrating: #{table.name}"
          puts "  - Creating default map and layers"
          table.create_default_map_and_layers if table.respond_to?(:map) && table.map.blank?
          table.reload
          puts "  - Migrating map"
          migrate_table_map(table)
          puts "  - Migrating layers"
          migrate_table_layers(table)
          migrated!(table)
        rescue => e
          notify_airbrake(e)
        end      
      end
    end
  end

  def migrate_table_map(table)
    map_metadata = JSON.parse(table.map_metadata) rescue {}
    map = table.map

    # All previous maps were based on google maps
    map.provider = "googlemaps"
    map.center = (map_metadata["latitude"].blank? ? "[0, 0]" : "[#{map_metadata["latitude"]},#{map_metadata["longitude"]}]")
    map.zoom = (map_metadata["zoom"].blank? ? 2 : map_metadata["zoom"])
    map.save
  end

  def migrate_table_layers(table)
    map_metadata = JSON.parse(table.map_metadata) rescue {}
    infowindow_metadata = JSON.parse(table.infowindow_without_new_model) rescue {}
    data_layer = table.map.data_layers.first

    data_layer.options['kind'] = 'carto'
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
    $tables_metadata.hset(table.key, 'migrated_to_20', true)
  end

end
