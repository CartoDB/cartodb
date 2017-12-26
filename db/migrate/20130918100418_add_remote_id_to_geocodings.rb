Sequel.migration do
  change do
    alter_table :geocodings do
      add_column :remote_id, :text
    end
  end
end
