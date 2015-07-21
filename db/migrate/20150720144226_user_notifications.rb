Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    Rails::Sequel::connection.run %Q{
      CREATE TABLE user_notifications(
        user_id uuid NOT NULL REFERENCES users (id),
        notification_id smallint NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        created_at timestamp without time zone DEFAULT now(),
        updated_at timestamp without time zone DEFAULT now(),
        PRIMARY KEY(user_id, notification_id)
      )
    }
  end

  down do
    drop_table :user_notifications
  end

end
