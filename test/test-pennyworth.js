/**
 * test/test-pennyworth.js - pennyworth
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

import 'mocha';
import 'should';

var pennyworth;
beforeEach(() => pennyworth = require('../pennyworth-dist'));

describe('test variable support', () => {
	describe('try regular end-of-line variable', () => {
		it('should grab "alfred" from "hey, alfred"', () =>
			pennyworth
				.template('hey, $subject.')('hey alfred')
				.subject.should.equal('alfred')
		);

		it('should grab rest of line from "hey, randomness and more randomness"', () =>
			pennyworth
				.template('hey, $text')('hey, randomness and more randomness')
				.text.should.equal('randomness and more randomness')
		);
	});

	describe('try a variable stuck in middle', () => {
		it('should grab "alfred" from "hey, alfred, how are you?"', () =>
			pennyworth
				.template('hey, $who, how are you?')('hi, alfred, how are you')
				.who.should.equal('alfred')
		);

		it('should grab "alfred and bruce" from "hey, alfred and bruce, how are you?"', () =>
			pennyworth
				.template('hey, $who, how are you?')('hey, alfred and bruce, how are you?')
				.who.should.equal('alfred and bruce')
		);
	});
});

describe('test directive support', () => {
	describe('try expansion directive', () => {
		it('should not match unexpanded list', () =>
			pennyworth
				.template('hi $who')('hey alfred')
				.who.should.not.equal('alfred')
		);

		it('should expand simple list', () =>
			pennyworth
				.template('[... hi, hey] $who')('hey alfred')
				.who.should.equal('alfred')
		);

		it('should log some info', () =>
			pennyworth.template('hi, $subject. [... how are you, what\'s up]?')
				('hi, alfred. what\'s up?')
				.subject.should.equal('alfred')
		);

		it('should expand list after some text', () =>
			pennyworth
				.template('hi, $subject. [... how are you, what\'s up]?')('hi, alfred. what\'s up?')
				.subject.should.equal('alfred')
		);
	});

	describe('try custom directive', () => {
		it('should expand to a list of greetings', () => {
			// define directive
			pennyworth.directive('greetings', () =>
				['hey', 'hi', 'hello'].map((greeting) => {
					return {
						type: 'text',
						value: greeting
					}
				})
			);

			// flatten is an internal method that
			// simplifies parsed lex to be used in
			// classification
			pennyworth.flatten(
				pennyworth.parse(
					pennyworth.lex(
						'[greetings], $subject.'
					)
				)
			).should.eql(['hey', 'hi', 'hello']);
		});
	});
});
