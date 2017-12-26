Sequel.migration do
  up do
    add_column :organizations, :geocoding_quota, :integer
    add_column :organizations, :map_view_quota, :integer
  end

  down do
    drop_column :organizations, :geocoding_quota
    drop_column :organizations, :map_view_quota
  end
end
