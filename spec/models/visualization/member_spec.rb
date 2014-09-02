# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../services/data-repository/repository'

include CartoDB

describe Visualization::Member do
  before do
    memory = DataRepository.new
    Visualization.repository  = memory
    Overlay.repository        = memory
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_mock = mock
    @user_mock.stubs(:id).returns(user_id)
    @user_mock.stubs(:username).returns(user_name)
    @user_mock.stubs(:api_key).returns(user_apikey)
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)
  end

  describe '#initialize' do
    it 'assigns an id by default' do
      member = Visualization::Member.new
      member.should be_an_instance_of Visualization::Member
      member.id.should_not be_nil
    end
  end #initialize

  describe '#store' do

    it 'should fail if no user_id attribute present' do
      attributes  = random_attributes
      attributes.delete(:user_id)
      member      = Visualization::Member.new(attributes)
      expect {
        member.store
      }.to raise_exception CartoDB::InvalidMember
    end

    it 'persists attributes to the data repository' do
      attributes  = random_attributes
      member      = Visualization::Member.new(attributes)
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name.should be_nil

      member.fetch
      member.name             .should == attributes.fetch(:name)
      member.active_layer_id  .should == attributes.fetch(:active_layer_id)
      member.privacy          .should == attributes.fetch(:privacy)

      member.permission.should_not be nil
      member.permission.owner_id.should eq @user_mock.id
      member.permission.owner_username.should eq @user_mock.username
    end

    it 'persists tags as an array if the backend supports it' do
      relation_id = UUIDTools::UUID.timestamp_create.to_s

      Permission.any_instance.stubs(:update_shared_entities).returns(nil)

      db_config   = Rails.configuration.database_configuration[Rails.env]
      # Why not passing db_config directly to Sequel.postgres here ?
      # See https://github.com/CartoDB/cartodb/issues/421
      db          = Sequel.postgres(
                      host:     db_config.fetch('host'),
                      port:     db_config.fetch('port'),
                      database: db_config.fetch('database'),
                      username: db_config.fetch('username')
                    )
      relation    = "visualizations_#{relation_id}".to_sym
      repository  = DataRepository::Backend::Sequel.new(db, relation)
      Visualization::Migrator.new(db).migrate(relation)
      attributes  = random_attributes(tags: ['tag 1', 'tag 2'])
      member      = Visualization::Member.new(attributes, repository)
      member.store
      
      member      = Visualization::Member.new({ id: member.id }, repository)
      member.fetch
      member.tags.should include('tag 1')
      member.tags.should include('tag 2')

      Visualization::Migrator.new(db).drop(relation)
    end

    it 'persists tags as JSON if the backend does not support arrays' do
      attributes  = random_attributes(tags: ['tag 1', 'tag 2'])
      member      = Visualization::Member.new(attributes)
      member.store

      member = Visualization::Member.new(id: member.id)
      member.fetch
      member.tags.should include('tag 1')
      member.tags.should include('tag 2')
    end

    it 'invalidates vizjson cache in varnish if name changed' do
      member      = Visualization::Member.new(random_attributes)
      member.store

      CartoDB::Visualization::NameChecker.any_instance.stubs(:available?).returns(true)

      member = Visualization::Member.new(id: member.id).fetch
      member.expects(:invalidate_varnish_cache)
      member.name = 'changed'
      member.store
    end

    it 'invalidates vizjson cache in varnish if privacy changed' do
      # Need to at least have this decorated in the user data or checks before becoming private will raise an error
      CartoDB::Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)
      
      member      = Visualization::Member.new(random_attributes)
      member.store

      member = Visualization::Member.new(id: member.id).fetch
      member.expects(:invalidate_varnish_cache)
      member.privacy = Visualization::Member::PRIVACY_PRIVATE
      member.store
    end

    it 'invalidates vizjson cache in varnish if description changed' do
      member      = Visualization::Member.new(random_attributes)
      member.store

      member = Visualization::Member.new(id: member.id).fetch
      member.expects(:invalidate_varnish_cache)
      member.description = 'changed description'
      member.store
    end
  end #store

  describe '#fetch' do
    it 'fetches attributes from the data repository' do
      attributes  = random_attributes
      member      = Visualization::Member.new(attributes).store
      member      = Visualization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.should == attributes.fetch(:name)
    end
  end #fetch

  describe '#delete' do
    it 'deletes this member data from the data repository' do
      member = Visualization::Member.new(random_attributes).store
      member.fetch
      member.name.should_not be_nil

      member.delete
      member.name.should be_nil

      lambda { member.fetch }.should raise_error KeyError
    end

    it 'invalidates vizjson cache' do
      member      = Visualization::Member.new(random_attributes)
      member.store

      member.expects(:invalidate_varnish_cache)
      member.delete
    end
  end #delete

  describe '#unlink_from' do
    it 'invalidates varnish cache' do
      member = Visualization::Member.new(random_attributes).store
      member.expects(:invalidate_varnish_cache)
      member.expects(:remove_layers_from)
      member.unlink_from(Object.new)
    end
  end #unlink_from

  describe '#public?' do
    it 'returns true if privacy set to public' do
      visualization = Visualization::Member.new(privacy: 'public')
      visualization.public?.should == true

      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE
      visualization.public?.should == false

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.public?.should == true
    end
  end #public?

  describe '#permissions' do
    it 'checks is_owner? permissions' do
      user_id  = UUIDTools::UUID.timestamp_create.to_s
      member  = Visualization::Member.new(name: 'foo', user_id: user_id)

      user    = OpenStruct.new(id: user_id)
      member.is_owner?(user).should == true

      user    = OpenStruct.new(id: UUIDTools::UUID.timestamp_create.to_s)
      member.is_owner?(user).should == false
    end

    it 'checks has_permission? permissions' do
      @user = create_user(:quota_in_bytes => 1234567890, :table_quota => 400)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)

      Permission.any_instance.stubs(:notify_permissions_change).returns(nil)

      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(nil)
      user3_mock = mock
      user3_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user3_mock.stubs(:username).returns('user3')
      user3_mock.stubs(:organization).returns(nil)
      user4_mock = mock
      user4_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user4_mock.stubs(:username).returns('user4')
      user4_mock.stubs(:organization).returns(nil)

      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL,
          user_id: @user.id
      )
      visualization.store

      permission = Permission.where(id: visualization.permission_id).first

      acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2_mock.id,
            username: user2_mock.username
          },
          access: Permission::ACCESS_READONLY
        },
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user3_mock.id,
            username: user3_mock.username
          },
          access: Permission::ACCESS_READWRITE
        }
      ]
      acl_expected = [
        {
          type: Permission::TYPE_USER,
          id: user2_mock.id,
          access: Permission::ACCESS_READONLY
        },
        {
          type: Permission::TYPE_USER,
          id: user3_mock.id,
          access: Permission::ACCESS_READWRITE
        }
      ]

      permission.acl = acl
      permission.save
      visualization.permission.acl.should eq acl_expected

      visualization.has_permission?(user2_mock, Visualization::Member::PERMISSION_READONLY).should eq true
      visualization.has_permission?(user2_mock, Visualization::Member::PERMISSION_READWRITE).should eq false

      visualization.has_permission?(user3_mock, Visualization::Member::PERMISSION_READONLY).should eq true
      visualization.has_permission?(user3_mock, Visualization::Member::PERMISSION_READWRITE).should eq true

      visualization.has_permission?(user4_mock, Visualization::Member::PERMISSION_READONLY).should eq false
      visualization.has_permission?(user4_mock, Visualization::Member::PERMISSION_READWRITE).should eq false

      @user.destroy
    end
  end

  describe 'validations' do
    describe '#privacy' do
      it 'must be present' do
        visualization = Visualization::Member.new
        visualization.valid?.should == false
        visualization.errors.fetch(:privacy).should_not be_nil
      end

      it 'must be valid' do
        visualization = Visualization::Member.new(privacy: 'wadus')
        visualization.valid?.should == false
        visualization.errors.fetch(:privacy).should_not be_nil
      end
    end # privacy

    describe '#name' do
      it 'must be available for the user (uniqueness)' do
        pending
      end

      it 'downcases names for table_visualizations' do
        visualization = Visualization::Member.new(type: 'table')
        visualization.name = 'visualization_1'
        visualization.name.should == 'visualization_1'
        visualization.name = 'Visualization_1'
        visualization.name.should == 'visualization_1'

        visualization = Visualization::Member.new(type: 'derived')
        visualization.name = 'Visualization 1'
        visualization.name.should == 'Visualization 1'
      end
    end #name

    describe '#full_errors' do
      it 'returns full error messages' do
        visualization = Visualization::Member.new
        visualization.valid?.should == false

        visualization.full_errors.join("\n").should =~ /privacy/
        visualization.full_errors.join("\n").should =~ /type/
        visualization.full_errors.join("\n").should =~ /name/
      end
    end
  end # validations

  describe '#derived?' do
    it 'returns true if type is derived' do
      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_DERIVED)
      visualization.derived?.should be_true
      visualization.table?.should be_false
      visualization.type_slide?.should be_false

      visualization.type = 'bogus'
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_false
    end
  end

  describe '#table?' do
    it "returns true if type is 'table'" do
      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_CANONICAL)
      visualization.derived?.should be_false
      visualization.table?.should be_true
      visualization.type_slide?.should be_false

      visualization.type = 'bogus'
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_false
    end
  end

  describe '#type_slide?' do
    it "returns true if type is 'slide'" do
      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_SLIDE)
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_true

      visualization.type = 'bogus'
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_false
    end
  end

  describe '#password' do
    it 'checks that when using password protected type, encrypted password is generated and stored correctly' do
      password_value = '123456'
      password_second_value = '456789'

      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_DERIVED)
      visualization.privacy = Visualization::Member::PRIVACY_PROTECTED

      visualization.password = password_value
      visualization.has_password?.should be_true
      visualization.is_password_valid?(password_value).should be_true

      # Shouldn't remove the password, and be equal
      visualization.password = ''
      visualization.has_password?.should be_true
      visualization.is_password_valid?(password_value).should be_true
      visualization.password = nil
      visualization.has_password?.should be_true
      visualization.is_password_valid?(password_value).should be_true

      # Modify the password
      visualization.password = password_second_value
      visualization.has_password?.should be_true
      visualization.is_password_valid?(password_second_value).should be_true
      visualization.is_password_valid?(password_value).should be_false

      # Test removing the password, should work
      visualization.remove_password
      visualization.has_password?.should be_false
      lambda { 
        visualization.is_password_valid?(password_value)
      }.should raise_error CartoDB::InvalidMember
    end
  end #password

  describe '#privacy_and_exceptions' do
    it 'checks different privacy options to make sure exceptions are raised when they should' do
      user_id = UUIDTools::UUID.timestamp_create.to_s

      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_DERIVED)
      visualization.name = 'test'
      visualization.user_id = user_id

      # Private maps allowed
      visualization.user_data = { actions: { private_maps: true } }

      # Forces internal "dirty" flag
      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE

      visualization.store

      # -------------

      # No private maps allowed
      visualization.user_data = { actions: { } }

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE

      # Derived table without private maps flag = error
      expect {
        visualization.store
      }.to raise_exception CartoDB::InvalidMember

      # -------------

      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_CANONICAL)
      visualization.name = 'test'
      visualization.user_id = user_id
      # No private maps allowed
      visualization.user_data = { actions: { } }

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE

      # Canonical visualizations can always be private
      visualization.store
    end
  end

  describe '#validation_for_link_privacy' do
    it 'checks that only users with private tables enabled can set LINK privacy' do
      user_id = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.any_instance.stubs(:named_maps)

      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name:     'test',
          type:     Visualization::Member::TYPE_CANONICAL,
          user_id:  user_id
      )
      visualization.user_data = { actions: { private_maps: true } }

      # Careful, do a user mock after touching user_data as it does some checks about user too
      user_mock = mock
      user_mock.stubs(:private_tables_enabled).returns(true)
      user_mock.stubs(:id).returns(user_id)
      Visualization::Member.any_instance.stubs(:user).returns(user_mock)

      visualization.valid?.should eq true

      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE
      visualization.valid?.should eq true


      visualization.privacy = Visualization::Member::PRIVACY_LINK
      visualization.valid?.should eq true

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC

      user_mock.stubs(:private_tables_enabled).returns(false)

      visualization.valid?.should eq true

      visualization.privacy = Visualization::Member::PRIVACY_LINK
      visualization.valid?.should eq false

      # "Reset"
      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_LINK,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL,
          user_id:  user_id
      )
      visualization.user_data = { actions: { private_maps: false } }
      # Unchanged visualizations could be
      visualization.valid?.should eq true

      # Simulate editing the privacy
      visualization.stubs(:privacy_changed).returns(true)
      # Now it can't
      visualization.valid?.should eq false
    end
  end

  describe '#default_privacy_values' do
    it 'Checks deault privacies for visualizations' do
      user_id = UUIDTools::UUID.timestamp_create.to_s
      user_mock = mock
      user_mock.stubs(:id).returns(user_id)

      # We don't care about values, just want an instance
      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL,
          user_id:  user_id
      )

      user_mock.stubs(:private_tables_enabled).returns(true)
      visualization.default_privacy(user_mock).should eq  Visualization::Member::PRIVACY_LINK

      user_mock.stubs(:private_tables_enabled).returns(false)
      visualization.default_privacy(user_mock).should eq  Visualization::Member::PRIVACY_PUBLIC
    end
  end

  it 'should not allow to change permission from the outside' do
    @user = create_user(:quota_in_bytes => 1234567890, :table_quota => 400)
    member = Visualization::Member.new(random_attributes({user_id: @user.id}))
    member.store
    member = Visualization::Member.new(id: member.id).fetch
    member.permission.should_not be nil
    member.permission_id = UUIDTools::UUID.timestamp_create.to_s
    member.valid?.should eq false
    @user.destroy
  end

  it 'checks that slides can have a parent_id' do
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

    member = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_SLIDE }))
    member.store

    member = Visualization::Member.new(id: member.id).fetch
    member.type.should eq Visualization::Member::TYPE_SLIDE
    member.parent_id.should be nil
    member.parent.should be nil

    child_member = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_SLIDE }))
    child_member.store

    child_member.parent_id = member.id
    child_member.store

    child_member = Visualization::Member.new(id: child_member.id).fetch
    child_member.type.should eq Visualization::Member::TYPE_SLIDE
    child_member.parent_id.should eq member.id
    child_member.parent.id.should eq member.id

    expected_errors = { parent_id: 'has invalid value' }

    table_member = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_CANONICAL }))
    table_member.store
    table_member.parent_id = member.id
    expect {
      table_member.store
    }.to raise_exception InvalidMember
    table_member.valid?.should eq false
    table_member.errors.should eq expected_errors

    vis_member = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_DERIVED }))
    vis_member.store
    vis_member.parent_id = member.id
    expect {
      vis_member.store
    }.to raise_exception InvalidMember
    vis_member.valid?.should eq false
    vis_member.errors.should eq expected_errors
  end

  protected

  def random_attributes(attributes={})
    random = UUIDTools::UUID.timestamp_create.to_s
    {
      name:         attributes.fetch(:name, "name #{random}"),
      description:  attributes.fetch(:description, "description #{random}"),
      privacy:      attributes.fetch(:privacy, Visualization::Member::PRIVACY_PUBLIC),
      tags:         attributes.fetch(:tags, ['tag 1']),
      type:         attributes.fetch(:type, Visualization::Member::TYPE_CANONICAL),
      user_id:      attributes.fetch(:user_id, @user_mock.id),
      active_layer_id: random,
      title:        attributes.fetch(:title, ''),
      source:       attributes.fetch(:source, ''),
      license:      attributes.fetch(:license, ''),
      parent_id:    attributes.fetch(:parent_id, nil)
    }
  end
end

