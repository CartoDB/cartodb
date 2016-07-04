Sequel.migration do
  up do
    alter_table :mapcaps do
      add_column :state, :string, type: 'json', null: false, default: '{}'
    end
  end

  down do
    alter_table :mapcaps do
      drop_column :state
    end
  end
end
