Sequel.migration do
  up do
    alter_table :geocodings do
      add_column :log_id, :uuid
    end
  end

  down do
    alter_table :geocodings do
      drop_column :log_id
    end
  end
end
