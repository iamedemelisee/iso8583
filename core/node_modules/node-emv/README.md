# Node EMV parser

EMV stands for Europay, MasterCard, and Visa, the three companies that originally created the standard. The standard is now managed by EMVCo, a consortium with control split equally among Visa, Mastercard, JCB, American Express, China UnionPay, and Discover.

EMV is standard to use smart cards in payment industry, chip card, EFT POS terminals and transaction processing. EMV data will be encoded in TLV(Tag, Length, Value) format, so that we need a sdk to work with such data. Node-emv is a library written in Javascript to provide parsing facility for EMV data, searching EMV tags and describing activities in EMV standard, like Terminal Verification Result, Appliction Interchange Profile, Cardholder Verification Method and so on.




## Installation

`$ npm install node-emv`




## Usage

```javascript
var emv = require('node-emv');

// Parsing EMV data
emv.parse('9F34030200009F26087DE7FED1071C1A279F270180', function(data){
	if(data != null){
		console.log(data);
	}
});

```

```javascript

// Parsing and describing EMV data
emv.describe('9F34030200009F26087DE7FED1071C1A279F270180', function(data){
	if(data != null){
		console.log(data);
	}		
});

```

```javascript

// Lookup an EMV tag in node-emv dictionary
emv.lookup('9F10', function(data){
	if(data.length > 0){
		// console.log(data[0].tag + ' ' + data[0].name);
		console.log(data);
	}		
});

```

```javascript

// Describing Terminal Verification Result(TVR)
emv.tvr('8000048000', function(data){
	if(data.length > 0){
		console.log(data);
	}		
});

```

```javascript

// Try to get information about Aplication Interchange Profile(AIP)
emv.aip('0040', function(data){
	if(data.length > 0){
		console.log(data);
	}		
});

```

```javascript

//Application Usage Control tag
emv.auc('2A7F', function(data){
	if(data.length > 0){
		console.log(data);
	}		
});


```

## Sample application

Please check out a desktop application which is using node-emv [here](https://github.com/mhdnamvar/emv-desktop-app).


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## License

MIT
