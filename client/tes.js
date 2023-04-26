const isoDefaultSpecs = {
    "000": {
      "label":"MTI",
      "fixedLength": true,
      "contentLength": 4,
      "minLength": 0,
      "maxLength": 0,
      "contentType": "n",
      "slug": null,
      "nestedElements": {}
    },
    "001": {
      "label":"Bitmap",
      "fixedLength": false,
      "contentLength": 16,
      "minLength": 0,
      "maxLength": 0,
      "contentType": "n",
      "slug": null,
      "nestedElements": {}
    }
  };
  
  for (const [key, value] of Object.entries(isoDefaultSpecs)) {
    console.log(key);
  }
  