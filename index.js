require('babel-core/register');

var pennyworth = require('./pennyworth');

pennyworth.directive('greetings', function (args) {
	return ['hey', 'hi', 'hello'].map(function (greeting) {
		return {
			type: 'text',
			value: greeting
		};
	});
});

console.log(pennyworth.flatten(
	pennyworth.parse(
		pennyworth.lex(
			'[greetings], $test.'
		)
	)
));