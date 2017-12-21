Sequel.migration do
  up do
    SequelRails.connection.run(%{
        ALTER TABLE synchronization_oauths DROP COLUMN id;
        ALTER TABLE synchronization_oauths ADD COLUMN id uuid NOT NULL default uuid_generate_v4();
        ALTER TABLE synchronization_oauths ADD PRIMARY KEY (id);
      })
  end

  down do
    SequelRails.connection.run(%{
        ALTER TABLE synchronization_oauths DROP COLUMN id;
        ALTER TABLE synchronization_oauths ADD COLUMN id SERIAL;
        ALTER TABLE synchronization_oauths ADD PRIMARY KEY (id);
      })
  end
end
