Sequel.migration do
  def up
    Layer.db["ALTER TABLE layers ALTER COLUMN updated_at SET DEFAULT NOW()"]
  end

  def down
  end
end
