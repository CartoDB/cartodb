require 'spec_helper_min'

describe CartoDB::Importer2::StringSanitizer do

  describe '#normalize' do
    it 'returns a blank string for blank strings' do
      expect(described_class.normalize(nil)).to eq('')
      expect(described_class.normalize('')).to eq('')
    end

    it 'normalizes non-english characters' do
      expect(
        described_class.normalize('àáâãäåāăùúûüūůűŭũų')
      ).to eq('aaaaaaaauuuuuuuuuu')
    end

    it 'normalizes non-english uppercase characters' do
      expect(
        described_class.normalize('ÀÁÂÃÄÅĀĂÒÓÔÕÖØŌŐŎŎ')
      ).to eq('AAAAAAAAOOOOOOOOOO')
    end

    it 'transliterates cyrillic when specified' do
      expect(described_class.normalize('БбВ', transliterate_cyrillic: true)).to eq('BbV')
    end

    it 'does not transliterate cyrillic when not specified' do
      expect(described_class.normalize('БбВ')).to eq('БбВ')
    end

    it 'transliterates greek' do
      expect(described_class.normalize('α')).to eq('a')
      expect(described_class.normalize('Τοπικές')).to eq('topIkes')
    end

    it 'applies greek transliteration rules from most specific to least specific' do
      expect(described_class.normalize('ιειι')).to eq('IeiI')
    end
  end

end
