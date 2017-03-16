/*jshint node:true*/
"use strict";

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    jshint: {
      src: ['src/**/*.js', 'test/**/*.js', '/*.json'],
      options: {
        undef: true,
        unused: true,
        predef: ['console', 'module', 'process', 'require', 'setInterval'],
      },
    },
  });

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['test']);
}
