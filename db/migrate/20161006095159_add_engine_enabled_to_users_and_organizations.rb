Sequel.migration do
  change do
    alter_table :users do
      add_column :engine_enabled, :boolean, null: false, default: true
    end

    alter_table :organizations do
      add_column :engine_enabled, :boolean, null: false, default: true
    end
  end
end
