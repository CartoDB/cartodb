require 'spec_helper'

describe Carto::UserCommons do
  # This is a trick to always have the reloaded record
  let(:original_user) { create(:user) }
  let(:sequel_user) { ::User[original_user.id] }
  let(:user) { ::Carto::User.find(original_user.id) }

  let(:organization_owner) { create(:user) }
  let(:organization) { Carto::Organization.find(create(:organization, owner: organization_owner).id) }

  describe '#has_access_to_coverband?' do
    let(:team_organization) { organization.update!(name: 'team'); organization }

    subject { user.has_access_to_coverband? }

    context 'in development' do
      it { should be_true }
    end

    context 'in production' do
      before { Rails.env.stubs(:production?).returns(true) }

      context 'when belongs to team' do
        before { user.update!(organization: team_organization) }

        it { should be_true }

        it 'is compatible with Sequel and ActiveRecord' do
          expect(user.has_access_to_coverband?).to eq(sequel_user.has_access_to_coverband?)
        end
      end

      context 'in any other case' do
        it { should be_false }
      end
    end
  end

  describe 'feature flags' do
    let(:feature_flag) { create(:feature_flag) }

    before { user.activate_feature_flag!(feature_flag) }

    describe '#self_feature_flags_user' do
      subject { user.self_feature_flags_user }

      it 'returns user feature flags' do
        expect(subject).to include(Carto::FeatureFlagsUser.find_by(user: user, feature_flag: feature_flag))
      end

      it 'is compatible with Sequel and ActiveRecord' do
        expect(subject).to eq(sequel_user.self_feature_flags_user)
      end
    end

    describe '#self_feature_flags' do
      subject { user.self_feature_flags }

      it 'returns user feature flags' do
        expect(subject).to include(feature_flag)
      end

      it 'is compatible with Sequel and ActiveRecord' do
        expect(subject).to eq(sequel_user.self_feature_flags)
      end
    end

    describe '#feature_flags' do
      subject { user.feature_flags }

      let(:organization_feature_flag) { create(:feature_flag) }

      it 'returns user feature flags' do
        expect(subject).to include(feature_flag)
      end

      it 'returns feature flags inherited from organization' do
        organization.update!(inherit_owner_ffs: true)
        user.update!(organization: organization)
        organization_owner.activate_feature_flag!(organization_feature_flag)

        expect(subject).to include(organization_feature_flag)
      end

      it 'is compatible with Sequel and ActiveRecord' do
        expect(subject).to eq(sequel_user.feature_flags)
      end
    end

    describe '#feature_flags_names' do
      subject { user.feature_flags_names }

      it 'returns user feature flags names' do
        expect(subject).to include(feature_flag.name)
      end

      it 'is compatible with Sequel and ActiveRecord' do
        expect(subject).to eq(sequel_user.feature_flags_names)
      end
    end

    describe '#has_feature_flag?' do
      subject { user.has_feature_flag?(feature_flag.name) }

      let(:other_feature_flag) { create(:feature_flag) }

      it 'returns user feature flags names' do
        expect(subject).to be_true
        expect(user.has_feature_flag?(other_feature_flag.name)).to be_false
      end

      it 'is compatible with Sequel and ActiveRecord' do
        expect(subject).to eq(sequel_user.has_feature_flag?(feature_flag.name))
      end
    end

    describe '#activate_feature_flag!' do
      let(:new_feature_flag) { create(:feature_flag) }

      context 'when not active yet' do
        it 'activates it' do
          user.activate_feature_flag!(new_feature_flag)
          user.reload

          expect(user.has_feature_flag?(new_feature_flag.name)).to be_true
        end
      end

      context 'when already active' do
        it 'preserves it' do
          user.activate_feature_flag!(feature_flag)
          user.reload

          expect(user.has_feature_flag?(feature_flag.name)).to be_true
        end
      end
    end

    describe '#update_feature_flags' do
      let(:old_feature_flag) { create(:feature_flag) }
      let(:new_feature_flag) { create(:feature_flag) }
      let(:user) { create(:user) }

      before { user.activate_feature_flag!(old_feature_flag) }

      it 'updates feature flags' do
        expect(user.feature_flags).to include(old_feature_flag)

        user.update_feature_flags([new_feature_flag.id])

        expect(user.feature_flags).not_to include(old_feature_flag)
        expect(user.feature_flags).to include(new_feature_flag)
      end

      it 'preserves existing feature flags if nil is received' do
        user.update_feature_flags

        expect(user.reload.feature_flags).not_to be_empty
      end
    end
  end
end
