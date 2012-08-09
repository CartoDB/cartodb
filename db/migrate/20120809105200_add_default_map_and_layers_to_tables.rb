Sequel.migration do
  up do
    # Create default map and layers for each table,
    # TODO this migration could become useless when
    # we finally separate tables and maps
    Table.all.each do |t|
      t.create_default_map_and_layers if t.respond_to?(:map) && t.map.blank?
    end
  end
  
  down do
  end
end
