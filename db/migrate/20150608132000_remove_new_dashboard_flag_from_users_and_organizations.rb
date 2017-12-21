Sequel.migration do
  up do
    drop_column :organizations, :new_dashboard_enabled
    drop_column :users, :new_dashboard_enabled
  end

  down do
    add_column :organizations, :new_dashboard_enabled, :boolean, default: true
    add_column :users, :new_dashboard_enabled, :boolean, default: true
  end
end
