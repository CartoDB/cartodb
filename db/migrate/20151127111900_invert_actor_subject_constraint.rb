Sequel.migration do
  up do
    SequelRails.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT IF EXISTS actor_subject_unique;
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT subject_actor_unique UNIQUE (subject, actor);
      })
  end

  down do
    SequelRails.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT IF EXISTS subject_actor_unique;
      })
    SequelRails.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT actor_subject_unique UNIQUE (actor, subject);
      })
  end
end
