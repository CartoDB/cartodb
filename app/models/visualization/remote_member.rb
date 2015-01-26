# encoding: utf-8

require_relative 'member'

module CartoDB
  module Visualization

    class RemoteMember < Member

      def initialize(name, user_id, privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC, description = '', tags = [])
        super({name: name, user_id: user_id, privacy: privacy, description: description, tags: tags, type: 'remote'})
      end

    end

  end
end
