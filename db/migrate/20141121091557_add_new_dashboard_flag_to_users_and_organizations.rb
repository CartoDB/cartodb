Sequel.migration do
  up do
    add_column :organizations, :new_dashboard_enabled, :boolean, default: false
    add_column :users, :new_dashboard_enabled, :boolean, default:false
  end

  down do
    drop_column :organizations, :new_dashboard_enabled
    drop_column :users, :new_dashboard_enabled
  end
end
