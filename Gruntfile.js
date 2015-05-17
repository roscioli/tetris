module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					"tetris.min.js": ["tetris.js"]
				}
			}
		},
		copy: {
		  main: {
		    files: [
      			{expand: true, flatten: true, src: ["tetris.min.js"], dest: "public/", filter: "isFile"}
		    ],
		  }
		}
	});


	grunt.registerTask("build", ["uglify", "copy"]);

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
};