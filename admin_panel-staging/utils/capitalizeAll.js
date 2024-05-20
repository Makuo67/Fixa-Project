export const capitalizeAll = (word) => {
  if (typeof word !== 'string' || word.trim() === '') {
    return '';
  }

  return word.replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}