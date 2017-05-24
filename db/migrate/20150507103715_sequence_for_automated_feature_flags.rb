# encoding: utf-8

class SequenceForAutomatedFeatureFlags < Sequel::Migration
  START_SEQ_NUMBER = -1000
  NAME = 'machine_added_feature_flags_id_seq'

  def up
    # Create sequence to avoid trouble generating unique ids
    # It starts in negative numbers and goes downward in order to be able to identify quickly flags added automatically
    SequelRails.connection.run(%Q{
      CREATE SEQUENCE #{NAME} INCREMENT BY -1
        START WITH #{START_SEQ_NUMBER}
        OWNED BY feature_flags.id;
    })
  end

  def down
    SequelRails.connection.run(%Q{
      DROP SEQUENCE IF EXISTS #{NAME}
    })
  end

end
