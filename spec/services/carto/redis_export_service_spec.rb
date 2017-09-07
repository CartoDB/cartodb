require 'spec_helper_min'

describe Carto::RedisExportService do
  before(:all) do
    sequel_organization = FactoryGirl.create(:organization)
    @organization = Carto::Organization.find(sequel_organization.id)
    @user = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    @organization.destroy
    @user.destroy
  end

  def with_redis_keys(prefix)
    $users_metadata.set("#{prefix}:string", 'something')
    $users_metadata.zincrby("#{prefix}:set", 5, 'set_key')
    $users_metadata.hset("#{prefix}:hash", 'hash_key', 'qwerty')

    yield
  ensure
    $users_metadata.del("#{prefix}:string", "#{prefix}:set", "#{prefix}:hash")
  end

  def check_export(export, prefix)
    expect(export[:redis][:users_metadata].keys.sort).to eq(["#{prefix}:hash", "#{prefix}:set", "#{prefix}:string"])
  end

  def check_redis(prefix)
    expect($users_metadata.get("#{prefix}:string")).to eq('something')
    expect($users_metadata.zrange("#{prefix}:set", 0, -1, withscores: true)).to eq([['set_key', 5.0]])
    expect($users_metadata.hgetall("#{prefix}:hash")).to eq('hash_key' => 'qwerty')
  end

  let(:service) { Carto::RedisExportService.new }

  describe '#export' do
    it 'exports an empty dictionary' do
      export = service.export_user_json_hash(@user)
      expect(export[:redis][:users_metadata]).to eq({})
    end

    it 'includes all keys under org:name for organizations' do
      prefix = "org:#{@organization.name}"
      with_redis_keys(prefix) do
        export = service.export_organization_json_hash(@organization)
        check_export(export, prefix)
      end
    end

    it 'includes all keys under user:username for users' do
      prefix = "user:#{@user.username}"
      with_redis_keys(prefix) do
        export = service.export_user_json_hash(@user)
        check_export(export, prefix)
      end
    end
  end

  describe '#export + import' do
    it 'copies all keys under org:name for organizations' do
      prefix = "org:#{@organization.name}"
      export = with_redis_keys(prefix) { service.export_organization_json_hash(@organization) }
      service.restore_redis_from_hash_export(export)
      check_redis(prefix)
    end

    it 'copies all keys under user:username for users' do
      prefix = "user:#{@user.username}"
      export = with_redis_keys(prefix) { service.export_user_json_hash(@user) }
      service.restore_redis_from_hash_export(export)
      check_redis(prefix)
    end
  end
end
