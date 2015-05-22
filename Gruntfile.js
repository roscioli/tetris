module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					"public/tetris.min.js": ["public/tetris.js"]
				}
			}
		}
	});


	grunt.registerTask("build", ["uglify"]);

	grunt.loadNpmTasks("grunt-contrib-uglify");
};