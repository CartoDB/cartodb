Sequel.migration do
  up do
    alter_table :data_imports do
      add_column :privacy, Integer
    end
  end

  down do
    alter_table :data_imports do
      drop_column :privacy
    end
  end
end
