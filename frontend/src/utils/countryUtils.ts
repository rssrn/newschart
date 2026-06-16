// @author Claude Sonnet 4.6 Anthropic
const SHORT_COUNTRY_NAMES: Record<string, string> = {
  'United States of America': 'United States',
  'United Arab Emirates': 'UAE',
  'Fr. S. Antarctic Lands': 'Fr. Antarctic',
  'Central African Rep.': 'C. African Rep.',
  'Trinidad and Tobago': 'Trinidad & Tobago',
  'Bosnia and Herz.': 'Bosnia & Herz.',
};

export function shortenCountryName(name: string): string {
  return SHORT_COUNTRY_NAMES[name] ?? name;
}

export function getCountryFlag(countryCode: string | undefined): string {
  if (countryCode?.length === 2) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.codePointAt(0)!);
    return String.fromCodePoint(...codePoints);
  }
  return '🌍';
}
