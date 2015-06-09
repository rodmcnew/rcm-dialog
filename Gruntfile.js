module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig(
        {
            pkg: grunt.file.readJSON('package.json'),
            uglify: {
                dist : {
                    options: {
                        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                        mangle: false,
                        sourceMap: true,
                        sourceMapName: 'dist/<%= pkg.name %>.map'
                    },
                    files: {
                        'dist/<%= pkg.name %>.min.js': [
                            'src/rcm-dialog.js',
                            'src/strategy/rcm-blank-dialog.js',
                            'src/strategy/rcm-blank-iframe-dialog.js',
                            'src/strategy/rcm-form-dialog.js',
                            'src/strategy/rcm-standard-dialog.js'
                        ]
                    }
                }
            },
            concat: {
                options: {
                },
                dist: {
                    src: [
                        'src/rcm-dialog.js',
                        'src/strategy/rcm-blank-dialog.js',
                        'src/strategy/rcm-blank-iframe-dialog.js',
                        'src/strategy/rcm-form-dialog.js',
                        'src/strategy/rcm-standard-dialog.js'
                    ],
                    dest: 'dist/<%= pkg.name %>.js'
                }
            }
        }
    );

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'concat']);
};
