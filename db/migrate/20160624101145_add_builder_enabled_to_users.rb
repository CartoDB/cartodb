Sequel.migration do
  change do
    alter_table :users do
      add_column :builder_enabled, :boolean, null: true, default: true
    end
  end
end
