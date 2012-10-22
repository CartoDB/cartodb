Sequel.migration do
  up do
    require Rails.root.join('lib/cartodb/migrator')

    Migrator.migrate_maps
    Migrator.migrate_layers
  end

  down do
  end
end
