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

const ner = require('./ner');
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
        lex: (template) => {
            var tokens = [],
                tmp = '',
                iterator = split(template);

            for (var word of iterator) {
                if (word[0] === '$') {
                    // add the text so far
                    if (tmp) {
                        tokens.push({
                            type: 'text',
                            value: tmp.trim()
                        });

                        tmp = '';
                    }

                    // trim off variable symbol
                    word = word.substr(1);

                    // look for punctuation
                    var m = word.match(new RegExp('[' + punc.join('') + ']', 'g'));
                    if (m) {
                        // grab matched punctuation
                        m = m[0];

                        // trim till there
                        var _tmp = word.substr(word.indexOf(m));
                        word = word.substr(0, word.indexOf(m));

                        // ask iterator for a redo
                        iterator.next(_tmp);
                    }

                    // split by name and filter
                    word = word.split(':');

                    // push to token list
                    tokens.push({
                        type: 'variable',

                        // name always comes first
                        value: word[0],

                        // default filter is string
                        filter: word[1] || 'string'
                    });
                } else if (word[0] === '[') {
                    // add the text so far
                    if (tmp) {
                        tokens.push({
                            type: 'text',
                            value: tmp.trim()
                        });

                        tmp = '';
                    }

                    // directive name
                    word = word.substr(1);

                    // see if more than just brackets
                    if (word.indexOf(']') !== -1) {
                        iterator.next(word.substr(1 + word.indexOf(']')));
                        word = word.substr(0, word.indexOf(']'));
                    }

                    if (word[word.length - 1] !== ']') {
                      // create arguments list
                      var args = [],
                          _tmp,
                          text = '';

                        do {
                            _tmp = iterator.next().value;
                            if (!_tmp) break;

                            if (_tmp.indexOf(']') === -1) {
                                text += _tmp + ' ';
                            } else {
                                text += _tmp.substr(0, _tmp.indexOf(']'));

                                if (_tmp.substr(1 + _tmp.indexOf(']'))) {
                                  iterator.next(_tmp.substr(1 + _tmp.indexOf(']')));
                                }
                            }
                        } while (_tmp.indexOf(']') === -1);

                        args = text.split(',').map((arg) => arg.trim());
                    } else word = word.substr(0, word.length - 1);

                    // add to list
                    tokens.push({
                        type: 'directive',
                        value: word,
                        args: args
                    });
                } else if (punc.indexOf(word) !== -1) {
                    // add the text so far
                    if (tmp) {
                        tokens.push({
                            type: 'text',
                            value: tmp.trim()
                        });

                        tmp = '';
                    }

                    tokens.push({
                        type: 'punctuation',
                        value: word
                    });
                } else {
                    if (word.match(/[\.,!\?]/g)) {
                        var c = '';

                        for (var i = 0; i < word.length; i += 1) {
                            if (punc.indexOf(word[i]) === -1) {
                                c += word[i];
                            } else {
                                if (c) {
                                    tokens.push({
                                        type: 'text',
                                        value: [tmp.trim(), c.trim()].join(' ').trim()
                                    });

                                    c = '';
                                    tmp = '';
                                }

                                tokens.push({
                                    type: 'punctuation',
                                    value: word[i]
                                });
                            }
                        }
                    } else {
                        tmp += word + ' ';
                    }
                }
            }

            // add remaining text
            if (tmp) {
                tokens.push({
                    type: 'text',
                    value: tmp.trim()
                });
            }

            return tokens;
        },

        parse: (lex) => {
            var tmp;

            for (var i = 0; i < lex.length; i += 1) {
                if (lex[i].type === 'directive') {
                    tmp = pennyworth.directive(lex[i].value, lex[i].args);
                    if (!(tmp instanceof Array)) tmp = [tmp];
                    tmp = tmp.map((text) => pennyworth.lex(text).filter((lex) => lex.value !== ''));

                    return arrayOf(tmp.length).map((nil, index) =>
                        pennyworth.parse(lex.slice(0, i).concat(tmp[index], lex.slice(i + 1)))
                    );
                }
            }

            return [lex];
        },

        flatten: (lex) => {
            return lex.map((_lex) =>
                flatten(_lex)
                    .filter((token) => token.type === 'text')
                    .map((token) => token.value)
                    .join(' ')
                    .trim()
            );
        },

        _directives: {
            '...': (args) => args,
            '?': (args) => args.concat([''])
        },

        directive: (name, options) => {
            if (typeof options === 'function') pennyworth._directives[name] = options;
            else return (pennyworth._directives[name] || ((arg) => arg)).call(null, options);
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
