/**
 * test/test-pennyworth.js - pennyworth
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

import 'mocha';
import 'should';

var pennyworth;
beforeEach(() => pennyworth = require('../pennyworth'));

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
	
	describe('try a variable stuck in a random place', () => {
		it('should grab "alfred" from "hey, alfred, how are you?"', () =>
			pennyworth
				.template('hey, $who, how are you?')('hi, alfred, how are you')
				.who.should.equal('alfred')
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
	});
});