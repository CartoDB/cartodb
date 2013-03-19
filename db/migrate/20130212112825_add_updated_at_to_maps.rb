Sequel.migration do
  change do
    alter_table :maps do
      add_column :updated_at, DateTime
    end
  end
end
