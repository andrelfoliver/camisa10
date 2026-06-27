export const formatProductName = (name) => {
  if (!name) return '';
  const acronyms = ['NHL', 'NBA', 'NFL', 'MLB', 'MLS', 'CAD', 'US', 'UK', 'EU', 'VIP'];
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      const upper = word.toUpperCase();
      if (acronyms.includes(upper)) return upper;
      if (word.includes('-')) {
        return word
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
