Sequel.migration do
  up do
    alter_table :geocodings do
      add_column :state, :text
    end
  end

  down do
    alter_table :geocodings do
      drop_column :state
    end
  end
end
