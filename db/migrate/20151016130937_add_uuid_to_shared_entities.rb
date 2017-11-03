Sequel.migration do
  up do
    SequelRails.connection.run(%{
        ALTER TABLE shared_entities DROP CONSTRAINT shared_entities_pkey;
      })
    SequelRails.connection.run(%{
        ALTER TABLE shared_entities ADD COLUMN id uuid NOT NULL default uuid_generate_v4();
      })
    SequelRails.connection.run(%{
        ALTER TABLE shared_entities ADD PRIMARY KEY (id);
      })
    end

  down do
    SequelRails.connection.run(%{
        ALTER TABLE shared_entities DROP CONSTRAINT shared_entities_pkey;
      })
    SequelRails.connection.run(%{
        ALTER TABLE shared_entities ADD PRIMARY KEY (recipient_id, entity_id);
      })
    SequelRails.connection.run(%{
        ALTER TABLE shared_entities DROP COLUMN id;
      })
  end
end
