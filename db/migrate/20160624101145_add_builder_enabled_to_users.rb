Sequel.migration do
  change do
    alter_table :users do
      add_column :builder_enabled, :text
    end
  end
end
