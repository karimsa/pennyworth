/**
 * lib/lexer.js - pennyworth
 * Creates lex from pennyworth string.
 * 
 * Licensed under GPL-3.0.
 * Copyright (C) 2016 Karim Alibhai.
 */

'use strict';

const extract = (new (require('extract-brackets'))('{')).extract;
const punc = ['.', ',', '!', '?'];
const pushtext = function ( text, lex ) {
    let tmp = {
        type: 'text',
        value: ''
    };

    text.split('').map((c) => {
        if ('.,!?'.indexOf(c) !== -1) {
            tmp.value = tmp.value.trim();
            if (tmp.value) {
                lex.push(tmp);
                tmp = {
                    type: 'text',
                    value: ''
                };
            }

            lex.push({
                type: 'punctuation',
                value: c
            });

            tmp = {
                type: 'text',
                value: ''
            };
        } else {
            tmp.value += c;
        }
    });

    tmp.value = tmp.value.trim();
    if (tmp.value) {
        lex.push(tmp);
        tmp = {
            type: 'text',
            value: ''
        };
    }

    lex = lex.slice(0, lex.length - 1);
};
const lextext = function ( text ) {
    const lex = [];
    let tmp = '';

    for (let word of text.split(' ')) {
        if (word[0] === '$') {
            if (tmp) {
                pushtext(tmp, lex);
                tmp = '';
            }

            word = word.substr(1);

            if (word.match(/[.,!?]/g) !== null) {
                word = word.split('');
                let split = [''];

                for (let i = 0; i < word.length; i += 1) {
                    if ('.,!?'.indexOf(word[i]) === -1) {
                        split[0] += word[i];
                    } else {
                        split.push(word.slice(i).join(''));
                    }
                }

                word = split[0];
                tmp = split[1];
            }

            word = word.split(':');
            let name = word[0], filter = word[1] || 'string';

            lex.push({
                type: 'variable',
                value: name,
                filter: filter
            });
        } else tmp += ' ' + word;
    }

    if (tmp) pushtext(tmp, lex);
    return lex;
};
const simplify = function ( brackets ) {
    let lex = [];

    for (let nest of brackets) {
        if (typeof nest === 'string') {
            lex = lex.concat(lextext(nest.trim()));
        } else {
            let tmp = [];
            let lexd = [];

            nest.forEach(function ( part ) {
                tmp = tmp.concat(part.split(','));
            });

            tmp.forEach(function (arg) {
                arg = arg.trim();
                
                if ( arg[arg.length - 1] === '?' ) return lexd.push({
                    type: 'conditional',
                    value: arg.substr(0, arg.length - 1)
                });

                lexd = lexd.concat(lextext(arg));
            });

            lex.push({
                type: 'expandable',
                value: lexd
            });
        }
    }

    return lex;
};

module.exports = function ( string ) {
    if (typeof string !== 'string') throw new Error('The lexer expects a string input.');
    return simplify( extract( `{${string.toLowerCase()}}` )[0].simple );
};