Sequel.migration do
  up do
    add_column :users, :dynamic_cdn_enabled, :boolean, default: false
  end

  down do
    drop_column :users, :dynamic_cdn_enabled
  end
end
