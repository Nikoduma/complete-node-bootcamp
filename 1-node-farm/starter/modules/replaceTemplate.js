module.exports = (template, product) => {
  let output = template.replaceAll(`{%PRODUCTNAME%}`, product.productName); // uso le regular expression per sostituire tutte le occorrenze
  output = output.replaceAll(`{%IMAGE%}`, product.image);
  output = output.replaceAll(`{%QUANTITY%}`, product.quantity);
  output = output.replaceAll(`{%PRICE%}`, product.price);
  output = output.replaceAll(`{%ID%}`, product.id);
  output = output.replaceAll(`{%DESCRIPTION%}`, product.description);
  output = output.replaceAll(`{%FROM%}`, product.from);
  output = output.replaceAll(`{%NUTRIENTS%}`, product.nutrients);

  output = !product.organic
    ? output.replace('{%NOT_ORGANIC%}', 'not-organic')
    : output;
  return output;
};
