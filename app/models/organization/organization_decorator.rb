module CartoDB
  module OrganizationDecorator
    def data(options = {})
      {
        :id             => self.id,
        :seats          => self.seats,
        :quota_in_bytes => self.quota_in_bytes,
        :created_at     => self.created_at,
        :updated_at     => self.updated_at,
        :name           => self.name,
        :owner          => {
          :id           => self.owner.id,
          :username     => self.owner.username,
          :avatar_url   => self.owner.avatar_url
        },
        :users          => self.users.map { |u|
          {
            :id       => u.id,
            :username => u.username,
            :avatar_url => u.avatar_url
          }
        }
      }
    end
  end
end