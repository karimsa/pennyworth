/**
 * lib/ner.js - alfred
 * Wrapper for Stanford NER.
 *
 * Licensed under GPL-3.0.
 * Copyright (C) 2016 Karim Alibhai.
 */

'use strict';

const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const exec = require('child_process').exec;

module.exports = (text) => new Promise(function (resolve, reject) {
    const fd = tmp.fileSync().name;
    const scriptdir = path.resolve(__dirname, '..', 'ner');

    fs.writeFile(fd, text, function (err) {
        if (err) return reject(err);
        exec(`java -mx700m -cp "${scriptdir}/stanford-ner.jar:${scriptdir}/lib/*" edu.stanford.nlp.ie.crf.CRFClassifier -loadClassifier ${scriptdir}/classifiers/english.all.3class.distsim.crf.ser.gz -textFile ${fd} -outputFormat tsv`, function (err, output) {
            if (err) reject(err);
            else resolve(
                output
                    .split(/\r?\n/g)
                    .map((line) => line.split('\t'))
                    .filter((line) => line[0])
                    .map((res) => [res[0], res[1].toLowerCase()])
            );
        });
    });
});
