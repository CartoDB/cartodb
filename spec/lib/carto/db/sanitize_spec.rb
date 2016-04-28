# encoding utf-8

require_relative '../../../../lib/carto/db/sanitize.rb'

module Carto
  module DB
    module Sanitize
      describe '#sanitize_identifier' do
        it 'should prepend t_ to identifiers starting with numbers' do
          identifier = '13102016manolo'
          sanitized_identifier = 't_13102016manolo'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should prepend t_ to identifiers starting with _' do
          identifier = '_manolo'
          sanitized_identifier = 't_manolo'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should strip whitespaces' do
          identifier = '                  manolo             '
          sanitized_identifier = 'manolo'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should remove repated _' do
          identifier = 'manolo___________escobar'
          sanitized_identifier = 'manolo_escobar'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should convert to lowercase' do
          identifier = 'MaNoLo'
          sanitized_identifier = 'manolo'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should replace whitespaces with _' do
          identifier = 'manolo escobar'
          sanitized_identifier = 'manolo_escobar'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should replace disallowed characters with _' do
          identifier = 'mañolo!#^èscœbar'
          sanitized_identifier = 'ma_olo_sc_bar'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should do all together' do
          identifier = '!#_   where'
          sanitized_identifier = 't_where'

          Carto::DB::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end

        it 'should append _t to identifiers that are RESERVED_WORDS' do
          Carto::DB::Sanitize::RESERVED_WORDS.each do |reserved_word_identifier|
            sanitized_identifier = reserved_word_identifier + '_t'

            Carto::DB::Sanitize.sanitize_identifier(reserved_word_identifier).should eq sanitized_identifier
          end
        end

        it 'should append _t to identifiers that are RESERVED_TABLE_NAMES' do
          Carto::DB::Sanitize::RESERVED_TABLE_NAMES.each do |reserved_word_identifier|
            sanitized_identifier = reserved_word_identifier + '_t'

            Carto::DB::Sanitize.sanitize_identifier(reserved_word_identifier).should eq sanitized_identifier
          end
        end

        it 'should append _t to identifiers that are SYSTEM_TABLE_NAMES' do
          Carto::DB::Sanitize::SYSTEM_TABLE_NAMES.each do |reserved_word_identifier|
            sanitized_identifier = reserved_word_identifier + '_t'

            Carto::DB::Sanitize.sanitize_identifier(reserved_word_identifier).should eq sanitized_identifier
          end
        end
      end

      describe '#append_with_truncate_and_sanitize' do
        it 'should append when length is normal' do
          identifier = 'manolo'
          suffix = '_escobar'

          appended_and_truncated = 'manolo_escobar'

          Carto::DB::Sanitize.append_with_truncate_and_sanitize(identifier, suffix).should eq appended_and_truncated
        end

        it 'should append when identifier is too long' do
          identifier = 'manolo' * 12
          suffix = '_escobar'

          Carto::DB::Sanitize.append_with_truncate_and_sanitize(identifier, suffix).end_with?(suffix).should be_true
        end

        it 'should raise when suffix is too long' do
          identifier = 'manolo' * 12

          expect { Carto::DB::Sanitize.append_with_truncate_and_sanitize(identifier, identifier) }.to raise_error
        end
      end
    end
  end
end
