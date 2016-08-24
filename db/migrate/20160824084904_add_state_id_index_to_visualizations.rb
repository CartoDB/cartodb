Sequel.migration do
  up do
    alter_table :visualizations do
      add_index :state_id
    end
  end

  down do
    alter_table :visualizations do
      drop_index :state_id
    end
  end
end
