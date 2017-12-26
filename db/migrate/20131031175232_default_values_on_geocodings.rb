Sequel.migration do
  up do
    alter_table :geocodings do
      set_column_default :processed_rows, 0
      set_column_default :total_rows, 0
    end
  end
  
  down do
    alter_table :geocodings do
      set_column_default :processed_rows, nil
      set_column_default :total_rows, nil
    end
  end
end
