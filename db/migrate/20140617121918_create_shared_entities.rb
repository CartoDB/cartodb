Sequel.migration do
  up do
    create_table :shared_entities do
      primary_key :id
      Uuid        :user_id,             null: false, :index => true
      Uuid        :entity_id,           null: false
      Text        :type,                null: false
      DateTime    :created_at,          default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,          default: Sequel::CURRENT_TIMESTAMP
    end

    alter_table(:shared_entities) do
      add_index [:user_id, :entity_id], :unique => true
    end
  end

  down do
    drop_table :shared_entities
  end

end
