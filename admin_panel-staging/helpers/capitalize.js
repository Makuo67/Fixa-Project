export const capitalize = (string) => {
  const str = string;
  const str2 = str?.charAt(0).toUpperCase() + str?.slice(1);
  return str2;
};

export const capitalizeAll = (sentence) => { 
  return sentence?.toString().replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
}


// Capitalize the first word of each sentence
export const capitalizeFirstWordOfEachSentence = (str) => {
  const sentences = str.split(", ");
  const capitalizedSentences = sentences.map((sentence) => {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  });
  const capitalizedStr = capitalizedSentences.join(", ");
  return capitalizedStr;
}