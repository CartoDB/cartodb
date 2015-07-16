Sequel.migration do
  up do
    drop_column :users, :dynamic_cdn_enabled
  end

  down do
    add_column :users, :dynamic_cdn_enabled, :boolean, default: false
  end
end
