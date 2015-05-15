module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					"build/tetris.min.js": ["src/tetris.js"]
				}
			}
		},
		copy: {
		  main: {
		    files: [
      			{expand: true, flatten: true, src: ["src/tetris.js"], dest: "build/", filter: "isFile"},
      			{expand: true, flatten: true, src: ["src/tetris.js"], dest: "example/", filter: "isFile"}
		    ],
		  },
		}
	});


	grunt.registerTask("build", ["uglify", "copy"]);

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
};