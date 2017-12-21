# encoding: utf-8

module CartoDB
  class Like < Sequel::Model

    # PK is (actor,subject)
    unrestrict_primary_key

    # @param actor String (uuid)
    # @param subject String (uuid)
    # @param created_at DateTime

  end

  class AlreadyLikedError < StandardError; end
end