/**
 * test/test-pennyworth.js - pennyworth
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

const mocha = require('mocha');
const should = require('should');

var pennyworth;
beforeEach(() => pennyworth = require('../'));

describe('test variable support', () => {
	describe('try regular end-of-line variable', () => {
		it('should grab "alfred" from "hey, alfred"', () =>
			pennyworth
				.template('hey, $subject.')('hey alfred')
				.then((res) => res.subject.should.equal('alfred'))
				.catch((err) => {
					throw err;
				})
		);

		it('should grab rest of line from "hey, randomness and more randomness"', () =>
			pennyworth
				.template('hey, $text')('hey, randomness and more randomness')
				.then((res) => res.text.should.equal('randomness and more randomness'))
				.catch((err) => {
					throw err;
				})
		);
	});

	describe('try a variable stuck in middle', () => {
		it('should grab "alfred" from "hey, alfred, how are you?"', () =>
			pennyworth
				.template('hey, $who, how are you?')('hi, alfred, how are you')
				.then((res) => res.who.should.equal('alfred'))
				.catch((err) => {
					throw err;
				})
		);

		it('should grab "alfred and bruce" from "hey, alfred and bruce, how are you?"', () =>
			pennyworth
				.template('hey, $who, how are you?')('hey, alfred and bruce, how are you?')
				.then((res) => res.who.should.equal('alfred and bruce'))
				.catch((err) => {
					throw err;
				})
		);
	});
});

describe('test directive support', () => {
	describe('try expansion directive', () => {
		it('should not match unexpanded list', () =>
			pennyworth
				.template('hi $who')('hey alfred')
				.then((res) => res.who.should.not.equal('alfred'))
				.catch((err) => {
					throw err;
				})
		);

		it('should expand simple list', () =>
			pennyworth
				.template('{hi, hey} $who')('hey alfred')
				.then((res) => res.who.should.equal('alfred'))
				.catch((err) => {
					throw err;
				})
		);

		it('should log some info', () =>
			pennyworth.template('hi, $subject. {how are you, what\'s up}?')('hi, alfred. what\'s up?')
				.then((res) => res.subject.should.equal('alfred'))
				.catch((err) => {
					throw err;
				})
		);

		it('should expand list after some text', () =>
			pennyworth
				.template('hi, $subject. {how are you, what\'s up}?')('hi, alfred. what\'s up?')
				.then((res) => res.subject.should.equal('alfred'))
				.catch((err) => {
					throw err;
				})
		);
	});
});
