require 'spec_helper_unit'

module Carto
  describe UsernameProposer do
    describe '#find_unique' do
      before do
        @users = Array.new
        @users << create(:carto_user_light, username: 'manolo')
        @users << create(:carto_user_light, username: 'manolo-1')
      end

      it 'returns same if available' do
        UsernameProposer.find_unique('escobar').should eq 'escobar'
      end

      it 'returns unique if not available' do
        UsernameProposer.find_unique('manolo').should eq 'manolo-2'
      end

      it 'fills in the gaps' do
        @users << create(:carto_user_light, username: 'manolo-3')

        UsernameProposer.find_unique('manolo').should eq 'manolo-2'
      end

      it 'returns same if max_retries is 0' do
        UsernameProposer.find_unique('manolo', max_retries: 0).should eq 'manolo'
      end

      it 'starts at given offset' do
        UsernameProposer.find_unique('manolo', offset: 8).should eq 'manolo-8'
      end

      it 'gives up if max_retries is reached' do
        UsernameProposer.find_unique('manolo', max_retries: 1).should eq 'manolo-1'
      end
    end
  end
end
