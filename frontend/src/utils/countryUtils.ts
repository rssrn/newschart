// @author Claude Sonnet 4.6 Anthropic
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
