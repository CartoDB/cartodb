Sequel.migration do
  change do
    alter_table :assets do
      add_column :kind, :text
    end
  end
end
