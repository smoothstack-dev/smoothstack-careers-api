export const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b(\w)/g, (s) => s.toUpperCase());
};

export const createObjectChunks = (obj: any, chunkSize: number) => {
  return Object.keys(obj).reduce((c, k, i) => {
    if (i % chunkSize == 0) {
      c.push(Object.fromEntries([[k, obj[k]]]));
    } else {
      c[c.length - 1][k] = obj[k];
    }
    return c;
  }, []);
};
