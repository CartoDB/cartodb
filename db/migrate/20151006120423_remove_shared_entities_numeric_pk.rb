Sequel.migration do
  up do
    Rails::Sequel.connection.run(%{
        ALTER TABLE shared_entities DROP CONSTRAINT shared_entities_pkey;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE shared_entities ADD PRIMARY KEY (recipient_id, entity_id);
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE shared_entities DROP COLUMN id;
      })
  end

  down do
    Rails::Sequel.connection.run(%{
        ALTER TABLE shared_entities DROP CONSTRAINT shared_entities_pkey;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE shared_entities ADD COLUMN id serial NOT NULL;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE shared_entities ADD PRIMARY KEY (id);
      })
  end
end
