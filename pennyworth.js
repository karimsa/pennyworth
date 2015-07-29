/**
 * pennyworth.js
 * a natural language templating engine.
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

var flatten = require('underscore').flatten,
    BayesClassifier = require('natural').BayesClassifier,
    punc = ['.', ',', '!', '?'],
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
                    word = word.substr(1).replace(new RegExp('[' + punc.join('') + ']', 'g'), '');

                    // create arguments list
                    var args = [],
                        _tmp;

                    if (word[word.length - 1] !== ']') {
                        // get next argument
                        do {
                            _tmp = iterator.next().value;
                            if (!_tmp) break;

                            if (_tmp.indexOf(']') !== -1) {
                                args.push(_tmp.substr(0, _tmp.indexOf(']')).replace(',', ''));

                                if (_tmp[_tmp.length - 1] !== ']') {
                                    iterator.next(_tmp.substr(_tmp.indexOf(']') + 1));
                                }
                            } else {
                                args.push(_tmp.replace(',', ''));
                            }
                        } while (_tmp.indexOf(']') === -1);
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

            return tokens;
        },
        
        parse: (lex) => {
            var tmp;
            
            for (var i = 0; i < lex.length; i += 1) {
                if (lex[i].type === 'directive') {
                    tmp = pennyworth.directive(lex[i].value, lex[i].args);
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
            '...': (args) => args.map((text) => {
                return {
                    type: 'text',
                    value: text
                };
             })
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
        
        filter: (name, options) => {
            if (typeof options === 'function') pennyworth._filters[name] = options;
            else return (pennyworth._filters[name] || ((arg) => arg)).call(null, options);
        },
        
        template: (text) => {
            var tpl = pennyworth
                        .parse(pennyworth.lex(text))
                        .map((array) => flatten(array)),
                classifier = new BayesClassifier();
            
            if (tpl.length > 1) {
                // load the classifier
                pennyworth
                    .flatten(tpl)
                    .forEach((text, index) => classifier.addDocument(text, String(index)));
            
                // train the classifier
                classifier.train();
            } else {
                classifier = {
                    classify () {
                        return '0';
                    }
                };
            }

            return (data) => {
                // get appropriate text
                var index = parseInt(classifier.classify(data), 10);

                // grab appropriate lex
                var lex = tpl[index]
                            .filter((token) => token.type !== 'punctuation');
                
                // create a scope to store data
                var scope = {};
                
                // parse out variables
                for (var i = 0; i < lex.length; i += 1) {
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
                        scope[lex[i].value] =
                            data
                                .substr(prev, next)
                                .replace(new RegExp('[' + punc.join('') + ']', 'g'), '')
                                .trim();

                        // apply the filter
                        scope[lex[i].value] = pennyworth.filter(lex[i].filter, scope[lex[i].value]);

                        // clean up data
                        data = data.substr(prev + next);
                    }
                }

                // return our created scope
                return scope;
            };
        }
    };

// export
module.exports = pennyworth;