class ChangeSynchronizationRunnedAtToRanAt < Sequel::Migration
  def up
    alter_table :synchronizations do
      drop_column :runned_at
      add_column :ran_at, DateTime
    end
  end

  def down
    alter_table :synchronizations do
      drop_column :ran_at
      add_column :runned_at, DateTime
    end
  end
end

