Sequel.migration do
  change do
    alter_table :geocodings do
      add_column :used_credits, :bigint
    end
  end
end
