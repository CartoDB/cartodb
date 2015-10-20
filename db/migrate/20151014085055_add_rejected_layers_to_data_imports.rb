Sequel.migration do
  up do
    alter_table :data_imports do
      add_column :rejected_layers, :text
    end
  end

  down do
    alter_table :data_imports do
      drop_column :rejected_layers
    end
  end
end
