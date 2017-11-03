Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    SequelRails::connection.run %Q{
      CREATE TABLE likes(
        actor uuid NOT NULL,
        subject uuid NOT NULL,
        created_at timestamp without time zone DEFAULT now(),
        PRIMARY KEY(actor, subject)
      )
    }
  end

  down do
    drop_table :likes
  end
end
