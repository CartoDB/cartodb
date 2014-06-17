Sequel.migration do
  up do
    add_column :permissions, :entity_id,    :uuid
    add_column :permissions, :entity_type,  :text
  end

  down do
    drop_column :permissions, :entity_id
    drop_column :permissions, :entity_type
  end
end
