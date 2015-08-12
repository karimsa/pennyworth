# pennyworth [![Build Status](https://magnum.travis-ci.com/karimsa/pennyworth.svg?token=bynzkcTP4XciV8soPs5e&branch=master)](https://magnum.travis-ci.com/karimsa/pennyworth)

a natural language templating engine for alfred.

## usage

```javascript
// build a template from a template string
var template = pennyworth.template('my beautiful template.');

// the template is a function that can be called with data at
// any time and multiple times
var compiled = template('my input string.');
```

## spec

### variables

template: `hello, $who.`

- for `hello, alfred` => $who = `alfred`
- for `hello, alfred. how are you?` => $who = `alfred how are you`
- for `hello, how are you?` => $who = `how are you`

template: `hello, $who. how are you?`

- for `hello, alfred.` => $who = `alfred`
- for `hello, alferd. how are you?` => $who = `alfred`
- for `hello, how are you?` => $who = ``

### variable filters

template: `i am $x years old.`

- for `i am 18 years old.` => $x = "18"

template: `i am $x:number years old.`

- for `i am 18 years old` => $x = 18

*Supported filters: string, integer, float, word.*

Adding a new filter:

```javascript
pennyworth.filter('my-new-filter', function ( input ) {
	return String(input) + '!';
});

var template = pennyworth.template('hello, $who:my-new-filter.');
template('hello, alfred.').who === 'alfred!'; // true
```

### directives

**`...`: expansion directive**

template: `[... hello, hey, hi], $who.`

*expands to `hello, $who`, `hey, $who`, and `hi, $who`*

Adding a new directive:

```javascript
pennyworth.directive('greetings', function (args) {
	return ['hey', 'hi', 'hello'].map(function (greeting) {
		return {
			type: 'text',
			value: greeting
		};
	});
});

var template = pennyworth.template('[greetings], $who.');
template('hi, alfred').who === 'alfred'; // true
```
