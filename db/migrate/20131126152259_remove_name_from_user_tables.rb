Sequel.migration do
  up do
    alter_table :user_tables do
      rename_column :name, :name_legacy
    end
  end
  
  down do
    alter_table :user_tables do
      rename_column :name_legacy, :name
    end
  end
end
