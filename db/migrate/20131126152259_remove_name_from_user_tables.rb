Sequel.migration do
  up do
    alter_table :user_tables do
      drop_column :name
    end
  end
  
  down do
    alter_table :user_tables do
      add_column :name, :text
    end
  end
end
