module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					"public/tetris.min.js": ["public/tetris.js"]
				}
			}
		},
		copy: {
		  main: {
		    files: [
      			{expand: true, flatten: false, src: ["bower_components/**"], dest: "public", filter: "isFile"}
		    ]
		  }
		}
	});


	grunt.registerTask("build", ["uglify", "copy"]);

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
};