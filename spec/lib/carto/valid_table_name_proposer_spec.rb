# encoding: utf-8

require_relative '../../../lib/carto/valid_table_name_proposer.rb'

module Carto
  describe ValidTableNameProposer do
    before(:all) do
      @valid_table_name_proposer = Carto::ValidTableNameProposer.new
    end

    let(:taken) { %w{table_m_nolo_es_co_bar_ table_m_nolo_es_co_bar_1 table_m_nolo_es_co_bar_3} }

    describe '#propose_valid_table_name' do
      it 'Regression for CDB-3446' do
        @valid_table_name_proposer.propose_valid_table_name('table_', taken_names: []).should == 'table_'
        @valid_table_name_proposer.propose_valid_table_name('table_', taken_names: ['table_']).should == 'table_1'
        @valid_table_name_proposer.propose_valid_table_name('table_', taken_names: ['table_1']).should == 'table_'
        @valid_table_name_proposer.propose_valid_table_name('table_1', taken_names: ['table_1']).should == 'table_1_1'
      end

      it 'sanitizes reserved words appending _t' do
        @valid_table_name_proposer.propose_valid_table_name('table', taken_names: ['table_1']).should == 'table_t'
      end

      it 'should sanitize name' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name("Mªnolo !Es'co`bar##!", taken_names: taken)

        valid_name.should eq 'm_nolo_es_co_bar_'
      end

      it 'handles long titles properly' do
        long_name1 = 'carto_long_filename_that_almost_matches_another_one_63chars_aaa'
        long_name2 = 'carto_long_filename_that_almost_matches_another_one_63chars_aab'
        expected_name = 'carto_long_filename_that_almost_matches_another_one_63chars_a_1'

        expect(
          @valid_table_name_proposer.propose_valid_table_name(long_name1, taken_names: [])
        ).to eq(long_name1)

        expect(
          @valid_table_name_proposer.propose_valid_table_name(long_name2, taken_names: [long_name1])
        ).to eq(expected_name)
      end

      it 'should remove disallowed starting characters' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name("____Mªnolo !Es'co`bar##!", taken_names: [])
        valid_name.should eq 'table_m_nolo_es_co_bar_'

        valid_name = @valid_table_name_proposer.propose_valid_table_name("____Mªnolo !Es'co`bar##!", taken_names: taken)
        valid_name.should eq 'table_m_nolo_es_co_bar_2'
      end

      it 'should find unused names' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name("____Mªnolo !Es'co`bar##!", taken_names: taken)

        valid_name.should eq 'table_m_nolo_es_co_bar_2'
      end

      it 'should find unused names when taken_names is specified' do
        taken = %w(manolo_escobar manolo_escobar_1)

        valid_name = @valid_table_name_proposer.propose_valid_table_name("manolo_escobar", taken_names: taken)

        valid_name.should eq 'manolo_escobar_2'
      end

      it 'should propose valid names when no contendent is specified' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name(taken_names: taken)

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when nil contendent is specified' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name(nil, taken_names: taken)

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when empty contendent is specified' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name('', taken_names: taken)

        valid_name.should eq 'untitled_table'
      end

      it 'should propose valid names when empty taken_names is specified' do
        valid_name = @valid_table_name_proposer.propose_valid_table_name(taken_names: taken)

        valid_name.should eq 'untitled_table'
      end
    end
  end
end
