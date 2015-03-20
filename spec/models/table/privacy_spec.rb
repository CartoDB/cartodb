# encoding: utf-8

require  'mocha'
require_relative '../../../app/models/table/privacy'


module CartoDB::Table

  describe Privacy do

    RSpec.configure do |config|
      config.mock_with :mocha
    end

    describe '#new' do
      it 'is private and raises an exception if invoked' do
        expect {
          Privacy.new(0)
        }.to raise_error(NoMethodError)
      end
    end

    describe '#from_sym' do
      it 'creates privacy objects from symbols' do
        p = Privacy.from_sym(:private)
        p.should eq Privacy::PRIVATE
      end
      it 'raises an exception if the symbol is not valid' do
        expect {
          Privacy.from_sym(:patata)
        }.to raise_error(InvalidPrivacyValue)
      end
    end

    describe '#from_int' do
      it 'creates privacy objects from integers' do
        p = Privacy.from_int(0)
        p.should eq Privacy::PRIVATE
      end
      it 'raises an exception if the value is not valid' do
        expect {
          Privacy.from_int(-1)
        }.to raise_error(InvalidPrivacyValue)
      end
    end

    describe '#from_str' do
      it 'creates privacy objects from strings' do
        p = Privacy.from_str('PRIVATE')
        p.should eq Privacy::PRIVATE
      end
      it 'raises an exception if the string is not valid' do
        expect {
          Privacy.from_str('patata')
        }.to raise_error(InvalidPrivacyValue)
      end
      it 'is case insensitive' do
        p = Privacy.from_str('pUbLic')
        p.should eq Privacy::PUBLIC
      end
    end

    describe '#from_anything' do
      it 'creates privacy objects from (almost) anything' do
        p1 = Privacy.from_anything(2)
        p1.should eq Privacy::LINK
        p2 = Privacy.from_anything('link')
        p2.should eq Privacy::LINK
      end
      it 'returns nil when it receives nil' do
        Privacy.from_anything(nil).should be_nil
      end
    end


    describe '#to_s' do
      it 'converts a privacy object to the corresponding string in upper case' do
        Privacy.from_sym(:private).to_s.should eq 'PRIVATE'
      end
    end

    describe '#to_sym' do
      it 'converts a privacy object to the corresponding symbol' do
        Privacy.from_str('public').to_sym.should eq :public
      end
    end

    describe '#to_i' do
      it 'converts a privacy object to the corresponding integer' do
        Privacy.from_str('link').to_i.should eq 2
      end
    end

    
  end

end
