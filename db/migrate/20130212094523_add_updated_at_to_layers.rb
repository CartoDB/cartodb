Sequel.migration do
  change do
    alter_table :layers do
      add_column :updated_at, DateTime
    end
  end
end
