Sequel.migration do
  change do
    alter_table :users do
      add_column :geocoding_quota, :integer
    end
  end
end
