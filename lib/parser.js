/**
 * lib/parser.js - pennyworth
 * Parses all directives in a pennyworth string.
 * 
 * Licensed under GPL-3.0.
 * Copyright (C) 2016 Karim Alibhai.
 */

'use strict';

module.exports = function ( lex ) {
    let array = [[]];

    for (let i = 0; i < lex.length; i += 1) {
        if ( lex[i].type === 'expandable' ) {
            let tmp = [];

            lex[i].value.forEach(function (value) {
                array.forEach(function (arr) {
                    tmp.push([].concat(arr, [ value.type === 'conditional' ? {
                        type: 'text',
                        value: value.value
                    } : value ]));
                });

                if ( value.type === 'conditional' ) {
                    array.forEach(function (arr) {
                        tmp.push([].slice.call(arr));
                    });
                }
            });

            array = tmp;
        } else array = array.map(function (arr) {
            arr.push(lex[i]);
            return arr;
        });
    }

    return array;
};