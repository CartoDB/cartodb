Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
    create_table :likes do
      Uuid      :actor,         primary_key: true, null: false, unique: false
      Uuid      :subject,       null: false
      DateTime  :created_at,  default: Sequel::CURRENT_TIMESTAMP
    end

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE likes ADD CONSTRAINT likes_actor_subject_key UNIQUE (actor, subject)
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX likes_subject_idx ON likes (subject)
    })
  end
  down do
    drop_table :likes
  end
end
