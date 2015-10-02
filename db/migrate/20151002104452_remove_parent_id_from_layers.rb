Sequel.migration do
  up do
    alter_table :layers do
      drop_column :parent_id
    end
  end

  down do
    alter_table :layers do
      add_column :parent_id, :uuid, :null => true
    end
  end
end
