Sequel.migration do
  up do
    alter_table :users do
      drop_column :max_layers
    end
  end

  down do
    alter_table :users do
      add_column :max_layers, :integer, default: 4
    end
  end
end
