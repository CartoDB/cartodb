Sequel.migration do
  up do
    alter_table :users do
      add_column :location, :text
    end
    alter_table :organizations do
      add_column :location, :text
    end
  end

  down do
    alter_table :users do
      drop_column :location
    end
    alter_table :organizations do
      drop_column :location
    end
  end
end
