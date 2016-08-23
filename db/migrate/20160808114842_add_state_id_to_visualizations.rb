Sequel.migration do
  up do
    alter_table :visualizations do
      add_foreign_key :state_id, :states, type: 'uuid', null: true
    end
  end

  down do
    alter_table :visualizations do
      drop_column :state_id
    end
  end
end
