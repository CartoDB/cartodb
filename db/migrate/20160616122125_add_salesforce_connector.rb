Sequel.migration do
  up do
    add_column :users,         :salesforce_datasource_enabled, :boolean, null: false, default: false
    add_column :organizations, :salesforce_datasource_enabled, :boolean, null: false, default: false
  end

  down do
    drop_column :users,         :salesforce_datasource_enabled
    drop_column :organizations, :salesforce_datasource_enabled
  end
end
