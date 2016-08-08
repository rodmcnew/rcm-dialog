module.exports = function (grunt) {

    var files = [
        'src/rcm-dialog.js',
        'src/rcm-dialog-module.js',
        'src/rcm-dialog-directive.js',
        'src/rcm-dialog-link-directive.js',
        'src/strategy/rcm-blank-dialog.js',
        'src/strategy/rcm-blank-iframe-dialog.js',
        'src/strategy/rcm-form-dialog.js',
        'src/strategy/rcm-standard-dialog.js'
    ];

    // Project configuration.
    grunt.initConfig(
        {
            pkg: grunt.file.readJSON('package.json'),
            uglify: {
                dist : {
                    options: {
                        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                        mangle: false,
                        sourceMap: true
                    },
                    files: {
                        'dist/<%= pkg.name %>.min.js': files
                    }
                }
            },
            concat: {
                options: {
                },
                dist: {
                    src: files,
                    dest: 'dist/<%= pkg.name %>.js'
                }
            },
            watch: {
                src: {
                    files: ['src/*.js', 'src/**/*.js'],
                    tasks: ['uglify', 'concat']
                }
            }
        }
    );

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'concat']);
};
