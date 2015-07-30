/**
 * gulpfile.babel.js - pennyworth
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

import gulp from 'gulp';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import rename from 'gulp-rename';

gulp.task('default', () =>
	gulp.src('pennyworth.js')
		.pipe(babel())
		.pipe(rename('pennyworth-dist.js'))
		.pipe(gulp.dest('.'))
);

gulp.task('test', ['default'], () =>
	gulp.src('test/test-pennyworth.js')
		.pipe(babel())
		.pipe(mocha())
);