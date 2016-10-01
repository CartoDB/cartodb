Sequel.migration do
  up do
    alter_table :user_creations do
      add_column :viewer, :boolean, null: false, default: false
    end
  end

  down do
    alter_table :user_creations do
      drop_column :viewer
    end
  end
end
