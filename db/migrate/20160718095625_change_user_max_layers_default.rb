Sequel.migration do
  up do
    alter_table :users do
      set_column_default :max_layers, 8
    end
  end

  down do
    alter_table :users do
      set_column_default :max_layers, 4
    end
  end
end
