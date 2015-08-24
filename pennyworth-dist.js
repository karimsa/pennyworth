/**
 * pennyworth.js
 * a natural language templating engine.
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

require('babel/polyfill');

var _underscore = require('underscore');

var _natural = require('natural');

var punc = ['.', ',', '!', '?'],
    split = regeneratorRuntime.mark(function split(text) {
    var tmp, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, word;

    return regeneratorRuntime.wrap(function split$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                context$1$0.prev = 3;
                _iterator = text.split(/\s+/g)[Symbol.iterator]();

            case 5:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                    context$1$0.next = 18;
                    break;
                }

                word = _step.value;
                context$1$0.next = 9;
                return word;

            case 9:
                tmp = context$1$0.sent;

                if (!tmp) {
                    context$1$0.next = 15;
                    break;
                }

                context$1$0.next = 13;
                return word;

            case 13:
                context$1$0.next = 15;
                return tmp;

            case 15:
                _iteratorNormalCompletion = true;
                context$1$0.next = 5;
                break;

            case 18:
                context$1$0.next = 24;
                break;

            case 20:
                context$1$0.prev = 20;
                context$1$0.t0 = context$1$0['catch'](3);
                _didIteratorError = true;
                _iteratorError = context$1$0.t0;

            case 24:
                context$1$0.prev = 24;
                context$1$0.prev = 25;

                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }

            case 27:
                context$1$0.prev = 27;

                if (!_didIteratorError) {
                    context$1$0.next = 30;
                    break;
                }

                throw _iteratorError;

            case 30:
                return context$1$0.finish(27);

            case 31:
                return context$1$0.finish(24);

            case 32:
            case 'end':
                return context$1$0.stop();
        }
    }, split, this, [[3, 20, 24, 32], [25,, 27, 31]]);
}),
    arrayOf = function arrayOf(size) {
    var tmp = [];
    while (size--) tmp.push(null);
    return tmp;
},
    pennyworth = {
    lex: function lex(template) {
        var tokens = [],
            tmp = '',
            iterator = split(template);

        var _iteratorNormalCompletion2 = true;

        // add remaining text
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = iterator[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var word = _step2.value;

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

                        args = text.split(',').map(function (arg) {
                            return arg.trim();
                        });
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
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                    _iterator2['return']();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        if (tmp) {
            tokens.push({
                type: 'text',
                value: tmp.trim()
            });
        }

        return tokens;
    },

    parse: function parse(lex) {
        var tmp;

        for (var i = 0; i < lex.length; i += 1) {
            if (lex[i].type === 'directive') {
                tmp = pennyworth.directive(lex[i].value, lex[i].args);
                return arrayOf(tmp.length).map(function (nil, index) {
                    return pennyworth.parse(lex.slice(0, i).concat(tmp[index], lex.slice(i + 1)));
                });
            }
        }

        return [lex];
    },

    flatten: function flatten(lex) {
        return lex.map(function (_lex) {
            return (0, _underscore.flatten)(_lex).filter(function (token) {
                return token.type === 'text';
            }).map(function (token) {
                return token.value;
            }).join(' ').trim();
        });
    },

    _directives: {
        '...': function _(args) {
            return args.map(function (text) {
                return {
                    type: 'text',
                    value: text
                };
            });
        }
    },

    directive: function directive(name, options) {
        if (typeof options === 'function') pennyworth._directives[name] = options;else return (pennyworth._directives[name] || function (arg) {
            return arg;
        }).call(null, options);
    },

    _filters: {
        'string': function string(text) {
            return String(text);
        },
        'int': function int(text) {
            return parseInt(text, 10);
        },
        'float': function float(text) {
            return parseFloat(text);
        }
    },

    filter: function filter(name, options) {
        if (typeof options === 'function') pennyworth._filters[name] = options;else return (pennyworth._filters[name] || function (arg) {
            return arg;
        }).call(null, options);
    },

    template: function template(text) {
        // remove apostrophes to stop clog
        text = text.split('\'').join('');

        var tpl = pennyworth.parse(pennyworth.lex(text)).map(function (array) {
            return (0, _underscore.flatten)(array);
        }),
            classifier = new _natural.LogisticRegressionClassifier();

        if (tpl.length !== 0) {
            // load the classifier
            pennyworth.flatten(tpl)

            // add each flattened command as a document
            .forEach(function (text, index) {
                return classifier.addDocument(text, String(index));
            });
        }

        // polyfill the classifier if it is unusable
        if (classifier.docs.length === 0) {
            classifier = {
                classify: function classify() {
                    return '0';
                },

                train: function train() {
                    return false;
                }
            };
        }

        // train the classifier
        classifier.train();

        return function (data) {
            // clean up apostrophes for input as well
            data = data.split('\'').join('');

            // get appropriate text
            var index = parseInt(classifier.classify(data), 10);

            // grab appropriate lex
            var lex = tpl[index].filter(function (token) {
                return token.type !== 'punctuation';
            });

            // create a scope to store data
            var scope = {};

            // parse out variables
            for (var i = 0; i < lex.length; i += 1) {
                if (lex[i].type === 'variable') {
                    // grab previous index
                    var prev;
                    if (i === 0) prev = 0;else prev = data.indexOf(lex[i - 1].value) + lex[i - 1].value.length;

                    // grab next index
                    var next;
                    if (i === lex.length - 1) next = data.length;else next = data.indexOf(lex[i + 1].value, prev) - prev;

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
exports['default'] = pennyworth;
module.exports = exports['default'];
//# sourceMappingURL=pennyworth-dist.js.map