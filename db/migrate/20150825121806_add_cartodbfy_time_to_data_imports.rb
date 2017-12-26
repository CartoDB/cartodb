Sequel.migration do
  up do
    alter_table :data_imports do
      add_column :cartodbfy_time, :float, :default => 0.0
    end
  end

  down do
    alter_table :data_imports do
      drop_column :cartodbfy_time
    end
  end

end
