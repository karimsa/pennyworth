/**
 * pennyworth.js
 * a natural language templating engine.
 * 
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

const { flatten } = require('underscore');
const { LogisticRegressionClassifier } = require('natural');

const ner = require('./lib/ner');
const entities = [ 'location', 'person', 'organization', 'money', 'percent', 'date', 'time' ];

const punc = ['.', ',', '!', '?'],
    split = function*(text) {
        var tmp;
        for (var word of text.split(/\s+/g)) {
            tmp = yield word;

            if (tmp) {
                yield word;
                yield tmp;
            }
        }
    },
    arrayOf = (size) => {
        var tmp = [];
        while (size --) tmp.push(null);
        return tmp;
    },
    pennyworth = {
        lex: require('./lib/lexer'),
        parse: require('./lib/parser'),

        flatten: (lex) => {
            return lex.map((_lex) =>
                flatten(_lex)
                    .filter((token) => token.type === 'text')
                    .map((token) => token.value)
                    .join(' ')
                    .trim()
            );
        },

        _filters: {
            'string': (text) => String(text),
            'int': (text) => parseInt(text, 10),
            'float': (text) => parseFloat(text)
        },

        filter: (name, callback) => {
            if (typeof callback === 'function') pennyworth._filters[name] = callback;
        },

        template: (text) => {
            // remove apostrophes to stop clog
            text = text.split('\'').join('');

            var tpl = pennyworth
                        .parse(pennyworth.lex(text))
                        .map((array) => flatten(array)),
                classifier = new LogisticRegressionClassifier();

            if (tpl.length !== 0) {
                // load the classifier
                pennyworth
                    .flatten(tpl)

                    // add each flattened command as a document
                    .forEach((text, index) => classifier.addDocument(text, String(index)));
            }

            // polyfill the classifier if it is unusable
            if (classifier.docs.length === 0) {
                classifier = {
                    classify () {
                        return '0';
                    },

                    train () {
                      return false;
                    }
                };
            }

            // train the classifier
            classifier.train();

            return (data) => {
                return new Promise((resolve, reject) => {
                    var i;

                    // clean up apostrophes for input as well
                    data = data.split('\'').join('');

                    // get appropriate text
                    var index = parseInt(classifier.classify(data), 10);

                    // grab appropriate lex
                    var lex = tpl[index]
                                .filter((token) => token.type !== 'punctuation');

                    // create a scope to store data
                    var scope = {};

                    // parse out variables
                    for (i = 0; i < lex.length; i += 1) {
                        if (lex[i].type === 'variable') {
                            // grab previous index
                            var prev;
                            if (i === 0) prev = 0;
                            else prev = data.indexOf(lex[i - 1].value) + lex[i - 1].value.length;

                            // grab next index
                            var next;
                            if (i === (lex.length - 1)) next = data.length;
                            else next = data.indexOf(lex[i + 1].value, prev) - prev;

                            // grab data
                            scope[lex[i].value] = data.substr(prev, next).trim();

                            // remove leading punctuation
                            if (punc.indexOf(scope[lex[i].value].charAt(0)) !== -1) {
                              scope[lex[i].value] = scope[lex[i].value].substr(1);
                            }

                            // remove trailing punctuation
                            if (punc.indexOf(scope[lex[i].value].charAt(scope[lex[i].value].length - 1)) !== -1) {
                              scope[lex[i].value] = scope[lex[i].value].substr(0, scope[lex[i].value].length - 1);
                            }

                            // remove leading/trailing whitespace
                            scope[lex[i].value] = scope[lex[i].value].trim();

                            // clean up data
                            data = data.substr(prev + next);
                        }
                    }

                    // apply filters
                    i = -1;
                    var apply = function () {
                        i += 1;

                        if (i === lex.length) resolve(scope);
                        else if ('filter' in lex[i]) {
                            let filter = pennyworth._filters[ lex[i].filter ];
                            if (!filter) return apply();

                            let ret = filter.call({
                                async: function () {
                                    return function (err, val) {
                                        if (err) throw err;

                                        scope[ lex[i].value ] = val;
                                        apply();
                                    };
                                }
                            }, scope[lex[i].value]);

                            if (ret !== undefined) {
                                scope[ lex[i].value ] = ret;
                                apply();
                            }
                        }
                        else apply();
                    };

                    apply();
                });
            };
        }
    };

// add all entities as filters
for (let entity of entities) {
    pennyworth.filter(entity, function ( data ) {
        const done = this.async();
        ner( data ).then((entities) => {
            done(null,
                entities.filter((res) => res[1] === entity)
                        .map((res) => res[0])
                        .join(' ')
            );
        }, done);
    });
}

// export
module.exports = pennyworth;
