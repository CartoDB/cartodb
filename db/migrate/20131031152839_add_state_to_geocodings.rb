Sequel.migration do
  change do
    alter_table :geocodings do
      add_column :state, :text
    end
  end
end
