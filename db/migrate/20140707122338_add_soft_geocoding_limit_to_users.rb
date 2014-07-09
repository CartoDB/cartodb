Sequel.migration do
  up do
    add_column :users, :soft_geocoding_limit, :boolean
  end

  down do
    remove_column :users, :soft_geocoding_limit
  end
end
