# encoding: utf-8
require_relative './organization/organization_decorator'
require_relative './permission'

class Organization < Sequel::Model

  ORG_VIS_KEY_FORMAT = "org_vis::%s"
  ORG_VIS_KEY_REDIS_TTL = 600

  include CartoDB::OrganizationDecorator
  include Concerns::CartodbCentralSynchronizable

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
  # @param geocoding_quota Integer
  # @param map_view_quota Integer
  # @param geocoding_block_price Integer
  # @param map_view_block_price Integer

  one_to_many :users
  many_to_one :owner, class_name: 'User', key: 'owner_id'

  plugin :validation_helpers

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

  ##
  # SLOW! Checks map views for every user in every organization
  # delta: get organizations who are also this percentage below their limit.
  #        example: 0.20 will get all organizations at 80% of their map view limit
  #
  def self.overquota(delta = 0)
    Organization.all.select do |o|
        limit = o.map_view_quota.to_i - (o.map_view_quota.to_i * delta)
        over_map_views = o.get_api_calls(from: o.owner.last_billing_cycle, to: Date.today) > limit

        limit = o.geocoding_quota.to_i - (o.geocoding_quota.to_i * delta)
        over_geocodings = o.get_geocoding_calls > limit

        limit =  o.twitter_datasource_quota.to_i - (o.twitter_datasource_quota.to_i * delta)
        over_twitter_imports = o.get_twitter_imports_count > limit

        over_map_views || over_geocodings || over_twitter_imports
    end
  end

  def get_api_calls(options = {})
    users.map{ |u| u.get_api_calls(options).sum }.sum
  end

  def get_geocoding_calls(options = {})
    users.map{ |u| u.get_geocoding_calls(options) }.sum
  end

  def get_twitter_imports_count(options = {})
    users.map{ |u| u.get_twitter_imports_count(options) }.sum
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
      :quota_in_bytes           => self.quota_in_bytes,
      :geocoding_quota          => self.geocoding_quota,
      :map_view_quota           => self.map_view_quota,
      :twitter_datasource_quota => self.twitter_datasource_quota,
      :map_view_block_price     => self.map_view_block_price,
      :geocoding_block_price    => self.geocoding_block_price,
      :seats                    => self.seats,
      :twitter_username         => self.twitter_username,
      :updated_at               => self.updated_at,
      :users => self.users.reject { |item| filtered_user && item.id == filtered_user.id }
        .map { |u|
        {
          :id         => u.id,
          :username   => u.username,
          :avatar_url => u.avatar_url
        }
      },
      :website          => self.website,
      :avatar_url       => self.avatar_url
    }
  end

  def public_visualizations(page_num = 1, items_per_page = 5, tag = nil)
    public_vis_by_type(CartoDB::Visualization::Member::DERIVED_TYPE, page_num, items_per_page, tag)
  end

  def public_visualizations_count
    public_vis_count_by_type(CartoDB::Visualization::Member::DERIVED_TYPE)
  end

  def public_datasets(page_num = 1, items_per_page = 5, tag = nil)
    public_vis_by_type(CartoDB::Visualization::Member::CANONICAL_TYPE, page_num, items_per_page, tag)
  end

  def public_datasets_count
    public_vis_count_by_type(CartoDB::Visualization::Member::CANONICAL_TYPE)
  end

  def tags(type, exclude_shared=true)
    users.map { |u| u.tags(exclude_shared, type) }.flatten
  end

  def get_auth_token
    if self.auth_token.nil?
      self.auth_token = make_auth_token
      self.save
    end
    self.auth_token
  end

  private

  def public_vis_by_type(type, page_num, items_per_page, tags)
    CartoDB::Visualization::Collection.new.fetch(
        user_id:  self.users.map(&:id),
        type:     type,
        privacy:  CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        page:     page_num,
        per_page: items_per_page,
        tags:     tags,
        order:    'updated_at',
        o:        {updated_at: :desc}
    )
  end

  def public_vis_count_by_type(type)
    CartoDB::Visualization::Collection.new.fetch(
        user_id:  self.users.map(&:id),
        type:     type,
        privacy:  CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        per_page: CartoDB::Visualization::Collection::ALL_RECORDS
    ).count
  end

  def name_exists_in_users?
    !User.where(username: self.name).first.nil?
  end

  def make_auth_token
    digest = secure_digest(Time.now, (1..10).map{ rand.to_s })
    10.times do
      digest = secure_digest(digest, CartoDB::Visualization::Member::TOKEN_DIGEST)
    end
    digest
  end

  def secure_digest(*args)
    Digest::SHA256.hexdigest(args.flatten.join)
  end

end

