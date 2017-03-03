Sequel.migration do
  up do
    SequelRails.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT likes_pkey;
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes ADD COLUMN id uuid NOT NULL default uuid_generate_v4();
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes ADD PRIMARY KEY (id);
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT actor_subject_unique UNIQUE (actor, subject);
      })
  end

  down do
    SequelRails.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT actor_subject_unique;
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT likes_pkey;
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes DROP COLUMN id;
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT likes_pkey PRIMARY KEY (actor, subject);
      })
  end
end
