module CartoDB
  module OrganizationDecorator
    def data(options = {})
      {
        :created_at       => self.created_at,
        :description      => self.description,
        :discus_shortname => self.discus_shortname,
        :display_name     => self.display_name,
        :id               => self.id,
        :name             => self.name,
        :owner            => {
          :id         => self.owner ? self.owner.id : nil,
          :username   => self.owner ? self.owner.username : nil,
          :avatar_url => self.owner ? self.owner.avatar_url : nil
        },
        :quota_in_bytes   => self.quota_in_bytes,
        :seats            => self.seats,
        :twitter_username => self.twitter_username,
        :updated_at       => self.updated_at,
        :users            => self.users.map { |u|
          {
            :id         => u.id,
            :username   => u.username,
            :avatar_url => u.avatar_url
          }
        },
        :website          => self.website
      }
    end
  end
end