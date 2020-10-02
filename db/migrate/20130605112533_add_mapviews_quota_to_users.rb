Sequel.migration do
  change do
    alter_table :users do
      add_column :map_view_quota, :integer, default: 10_000
    end
  end
end
