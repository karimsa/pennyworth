# pennyworth [![Build Status](https://travis-ci.org/karimsa/pennyworth.svg)](https://travis-ci.org/karimsa/pennyworth)

a natural language templating engine

[![NPM](https://nodei.co/npm/pennyworth.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/pennyworth/)

## usage

```javascript
// build a template from a template string
var template = pennyworth.template('my $adjective template.');

// the template is a function that can be called with data at
// any time and multiple times
template('my beautiful template').then(function (compiled) {
	// it will always return a promise to allow support for
	// asynchronous filters

	console.log(compiled); // { adjective : 'beautiful' }
});
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

template: `i am $x:int years old.`

- for `i am 18 years old` => $x = 18

*Supported filters: string, int, float, word.*

Adding a new filter:

```javascript
pennyworth.filter('my-new-filter', function ( input ) {
	return String(input) + '!';
});

var template = pennyworth.template('hello, $who:my-new-filter.');
template('hello, alfred.').who === 'alfred!'; // true
```

For asynchronous filters, grab a callback using this.async():

```javascript
pennyworth.filter('async', function ( input ) {
	let done = this.async();
	done( error , filtered );
});
``` 

## named entities

pennyworth uses the Stanford NER for named entity filters.

*Supported filters (from the 7 class model): Location, Person, Organization, Money, Percent, Date, Time*

To use any, just use the entity type as the filter name:

For instance, for the input string `My name is Alfred Pennyworth not Wayne Mansion.`, if you use the filter
'string': `My name is $name:string` then the resolved name will be "Alfred Pennyworth not Wayne Mansion". But
if you use the filter 'person', the output will be "Alfred Pennyworth".

### directives

**`...`: expansion directive**
**`?`: conditional directive**

template: `[... hello, hey, hi], $who.`

*expands to `hello, $who`, `hey, $who`, and `hi, $who`*

Adding a new directive:

```javascript
pennyworth.directive('greetings', function (args) {
	// the function of a directive is to expand into a more complex
	// pennyworth template string
	// therefore, you must return either a pennyworth string or a list
	// of pennyworth strings
	return ['hey', 'hi', 'hello'];
});

var template = pennyworth.template('[greetings], $who.');
template('hi, alfred').who === 'alfred'; // true
```
