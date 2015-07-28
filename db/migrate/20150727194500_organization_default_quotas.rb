# encoding utf-8

Sequel.migration do

  up do

    alter_table :organizations do
      add_column :default_soft_geocoding_limit, :boolean, default: false, null: false
      add_column :default_soft_twitter_datasource_limit, :boolean, default: false, null: false
      add_column :default_private_tables_enabled, :boolean, default: true, null: false
      add_column :default_private_maps_enabled, :boolean, default: true, null: false
      add_column :default_sync_tables_enabled, :boolean, default: true, null: false
    end

  end

  down do

    alter_table :organizations do
      drop_column :default_sync_tables_enabled
      drop_column :default_private_maps_enabled
      drop_column :default_private_tables_enabled
      drop_column :default_soft_twitter_datasource_limit
      drop_column :default_soft_geocoding_limit
    end

  end

end
