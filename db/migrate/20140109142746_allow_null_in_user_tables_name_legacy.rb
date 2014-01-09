Sequel.migration do
  up do
    alter_table :user_tables do
      set_column_allow_null(:name_legacy)
    end
  end
  
  down do
    alter_table :user_tables do
      set_column_not_null(:name_legacy)
    end
  end
end
