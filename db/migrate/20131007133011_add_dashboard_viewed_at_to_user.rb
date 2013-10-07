Sequel.migration do
  change do
    alter_table :users do
      add_column :dashboard_viewed_at, DateTime
    end
  end
end
