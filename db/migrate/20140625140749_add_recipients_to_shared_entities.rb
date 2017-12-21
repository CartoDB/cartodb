Sequel.migration do
  up do
    rename_column :shared_entities, :user_id, :recipient_id
    rename_column :shared_entities, :type, :entity_type
    add_column :shared_entities, :recipient_type, :text
    run "ALTER TABLE shared_entities ADD CONSTRAINT recipient_type_check CHECK (recipient_type IN ('user', 'org'));"
  end

  down do
    drop_column :shared_entities, :recipient_type
    rename_column :shared_entities, :entity_type, :type
    rename_column :shared_entities, :recipient_id, :user_id
  end
end
