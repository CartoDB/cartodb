Sequel.migration do
  up do
    alter_table :mapcaps do
      add_column :state_json, :string, type: 'json', null: false, default: '{}'
    end
  end

  down do
    alter_table :mapcaps do
      drop_column :state_json
    end
  end
end
