class AddDefaultToLayersUpdatedAt < Sequel::Migration
  def up
    SequelRails.connection.run("ALTER TABLE layers ALTER COLUMN updated_at SET DEFAULT NOW()")
  end

  def down
  end
end
