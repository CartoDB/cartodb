class AddModifiedAtEtagAndChecksumToSynchronization < Sequel::Migration
  def up
    alter_table :synchronizations do
      add_column :modified_at, DateTime
      add_column :etag, String
      add_column :checksum, String
    end
  end

  def down
    alter_table :synchronizations do
      drop_column :modified_at
      drop_column :etag
      drop_column :checksum
    end
  end
end

