Sequel.migration do
  change do
    alter_table :users do
      add_column :upgraded_at, DateTime
    end
  end
end
