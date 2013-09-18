Sequel.migration do
  change do
    alter_table :geocodings do
      add_column :formatter, :text
    end
  end
end
