# encoding: utf-8
require_relative './organization/organization_decorator'
require_relative './permission'

class Organization < Sequel::Model

  include CartoDB::OrganizationDecorator
  Organization.raise_on_save_failure = true
  self.strict_param_setting = false

  # @param id String (uuid)
  # @param seats String
  # @param quota_in_bytes Integer
  # @param created_at Timestamp
  # @param updated_at Timestamp
  # @param name String
  # @param avatar_url String
  # @param website String
  # @param description String
  # @param display_name String
  # @param discus_shortname String
  # @param twitter_username String

  one_to_many :users
  many_to_one :owner, class_name: 'User', key: 'owner_id'

  plugin :validation_helpers

  # Attributes synched with CartoDB Central
  def api_attributes
    [
      :name, :seats, :quota_in_bytes,
      :display_name, :description,
      :website, :discus_shortname, :twitter_username
    ]
  end # api_attributes

  def api_attributes_with_values
    Hash[*self.api_attributes.map{ |x| [x, self[x]] }.flatten]
  end

  def validate
    super
    validates_presence [:name, :quota_in_bytes, :seats]
    validates_unique   :name
    validates_format   /^[a-z0-9\-]+$/, :name, message: 'must only contain lowercase letters, numbers & hyphens'
    errors.add(:name, 'cannot exist as user') if name_exists_in_users?
  end

  # Just to make code more uniform with user.database_schema
  def database_schema
    self.name
  end

  def before_save
    super
    self.updated_at = Time.now
    raise errors unless valid?
  end

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum.to_i
  end

  def assigned_quota
    users_dataset.sum(:quota_in_bytes).to_i
  end

  def unassigned_quota
    quota_in_bytes - assigned_quota
  end

  def to_poro(filtered_user = nil)
    filtered_user ||= self.owner
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
        :avatar_url => self.owner ? self.owner.avatar_url : nil,
        :email      => self.owner ? self.owner.email : nil
      },
      :quota_in_bytes   => self.quota_in_bytes,
      :seats            => self.seats,
      :twitter_username => self.twitter_username,
      :updated_at       => self.updated_at,
      :users            => self.users.reject { |item| filtered_user && item.id == filtered_user.id }
        .map { |u|
        {
          :id         => u.id,
          :username   => u.username,
          :avatar_url => u.avatar_url
        }
      },
      :website          => self.website
    }
  end

  def organization_visualizations(page_num = 1, items_per_page = 5)
    # 1) get all members
    member_ids = self.users.map { |user|
      user.id
    }
    # 2) check permissions from them containing organization in the ACL
    entity_ids = CartoDB::Permission.where(owner_id: member_ids).map { |perm|
      if perm.acl.empty?
        nil
      else
        entity_id = nil
        perm.acl.each { |acl_entry|
          if perm[:entity_type] == CartoDB::Permission::ENTITY_TYPE_VISUALIZATION && \
             acl_entry[:type] == CartoDB::Permission::TYPE_ORGANIZATION && acl_entry[:id] == self.id
            entity_id = perm[:entity_id]
          end
        }
        entity_id
      end
    }.compact

    # 3) retrieve Vis
    visualizations = Visualization::Collection.new.fetch(
        id: entity_ids,
        type:     Visualization::Member::DERIVED_TYPE,
        privacy:  Visualization::Member::PRIVACY_PUBLIC,
        page:     page_num,
        per_page: items_per_page,
        order:    'updated_at',
        o:        {updated_at: :desc},
    )

    # TODO: Store in redis final vis_id list

    visualizations
  end

  private

  def name_exists_in_users?
    !User.where(username: self.name).first.nil?
  end

end

