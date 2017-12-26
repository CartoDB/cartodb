require_relative '../spec_helper'

shared_examples_for 'shared entity models' do
  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  describe '#create' do
    it 'tests basic creation and validation' do
      recipient_id   = UUIDTools::UUID.timestamp_create.to_s
      entity_id      = UUIDTools::UUID.timestamp_create.to_s

      shared_entity_class.where(entity_id: entity_id).count.should eq 0

      shared_entity = shared_entity_class.new(
        recipient_id:   recipient_id,
        recipient_type: shared_entity_class::RECIPIENT_TYPE_USER,
        entity_id:      entity_id,
        entity_type:    shared_entity_class::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.valid?.should eq true
      shared_entity.errors.should be_empty
      shared_entity.save

      shared_entity_class.where(entity_id: entity_id).count.should eq 1

      shared_entity2 = shared_entity_class.new(
        recipient_id:   recipient_id,
        recipient_type: shared_entity_class::RECIPIENT_TYPE_USER,
        entity_id:      entity_id,
        entity_type:    shared_entity_class::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity2.valid?.should eq false
      # Workaround for cross-ORM compatibility
      # shared_entity2.errors.should eq({[:recipient_id, :entity_id]=>['is already taken']})
      shared_entity2.errors.values.should eq([["is already taken"]])
      shared_entity.destroy

      shared_entity_class.where(entity_id: entity_id).count.should eq 0

      shared_entity = shared_entity_class.new(
        recipient_id:   entity_id,
        recipient_type: shared_entity_class::RECIPIENT_TYPE_USER,
        entity_type:    shared_entity_class::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.valid?.should eq false

      shared_entity = shared_entity_class.new(
        recipient_id:   recipient_id,
        recipient_type: shared_entity_class::RECIPIENT_TYPE_USER,
        entity_type:    shared_entity_class::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.valid?.should eq false

      shared_entity = shared_entity_class.new(
        recipient_id:   recipient_id,
        recipient_type: shared_entity_class::RECIPIENT_TYPE_USER,
        entity_id:      entity_id,
      )
      shared_entity.valid?.should eq false

      shared_entity = shared_entity_class.new(
      )
      shared_entity.valid?.should eq false

      shared_entity = shared_entity_class.new(
        recipient_id:   recipient_id,
        recipient_type: shared_entity_class::RECIPIENT_TYPE_USER,
        entity_id:      entity_id,
        entity_type:    'whatever'
      )
      shared_entity.valid?.should eq false
    end
  end
end