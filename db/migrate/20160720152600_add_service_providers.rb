Sequel.migration do
  up do
    alter_table(:users) do
      add_column :geocoder_provider, :text
      add_column :isolines_provider, :text
      add_column :routing_provider, :text
    end
    alter_table(:organizations) do
      add_column :geocoder_provider, :text
      add_column :isolines_provider, :text
      add_column :routing_provider, :text
    end
  end

  down do
    alter_table(:users) do
      drop_column :geocoder_provider
      drop_column :isolines_provider
      drop_column :routing_provider
    end
    alter_table(:organizations) do
      drop_column :geocoder_provider
      drop_column :isolines_provider
      drop_column :routing_provider
    end
  end
end
