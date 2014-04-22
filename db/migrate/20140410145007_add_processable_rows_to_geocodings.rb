Sequel.migration do
  change do
    alter_table :geocodings do
      add_column :processable_rows, :bigint
    end
  end
end
