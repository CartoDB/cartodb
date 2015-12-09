Sequel.migration do
  up do
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT IF EXISTS actor_subject_unique;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT subject_actor_unique UNIQUE (subject, actor);
      })
  end

  down do
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes DROP CONSTRAINT IF EXISTS subject_actor_unique;
      })
    Rails::Sequel.connection.run(%{
        ALTER TABLE likes ADD CONSTRAINT actor_subject_unique UNIQUE (actor, subject);
      })
  end
end
