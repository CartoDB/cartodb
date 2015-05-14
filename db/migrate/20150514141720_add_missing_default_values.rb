Sequel.migration do
  up do
    alter_table :layers do
      set_column_default :options, '{}'
    end
    alter_table :overlays do
      set_column_default :options, '{}'
      set_column_default "order", 0
    end
  end
  
  down do
    alter_table :layers do
      set_column_default :options, nil
    end
    alter_table :overlays do
      set_column_default :options, nil
      set_column_default "order", nil
    end
  end
end
