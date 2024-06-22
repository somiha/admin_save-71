const uniqueIdString =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789abcdefghijklmnopqrstuvwxyz";

exports.genertateUniqueId = (length = 8) => {
  let uniqueId = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * uniqueIdString.length);
    uniqueId += uniqueIdString[randomIndex];
  }
  return uniqueId;
};
