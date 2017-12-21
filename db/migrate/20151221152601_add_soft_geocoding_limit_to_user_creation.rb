Sequel.migration do
  up do
    alter_table :user_creations do
      add_column :soft_geocoding_limit, :boolean, default: true
    end
  end

  down do
    alter_table :user_creations do
      drop_column :soft_geocoding_limit
    end
  end
end
