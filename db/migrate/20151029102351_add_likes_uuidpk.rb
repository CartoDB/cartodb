Sequel.migration do
  up do
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT likes_pkey;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes ADD COLUMN id uuid NOT NULL default uuid_generate_v4();
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes ADD PRIMARY KEY (id);
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT actor_subject_unique UNIQUE (actor, subject);
      })
  end

  down do
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT actor_subject_unique;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT likes_pkey;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes DROP COLUMN id;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT likes_pkey PRIMARY KEY (actor, subject);
      })
  end
end
