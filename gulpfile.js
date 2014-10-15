var pkg       = require('./package.json');
var userProps = require('./gulpfile.user.json');
var gulp      = require('gulp');
var path      = require('path');
var del       = require('del');
var zip       = require('gulp-zip');
var xmlEditor = require('gulp-xml-editor');
var jshint    = require('gulp-jshint');
var filter    = require('gulp-filter');
var Q         = require('q');

var packageName            = 'linkNinja-'+pkg.version;
var firefoxExtensionId     = 'linkNinja@aleciten.com';
var firefoxPackageFileName = packageName+'.xpi';
var distPath               = 'dist';
var buildPath              = 'build';

var isWindows = (require('os').platform() === 'win32');

gulp.task('createFirefoxLink', function() {
    var fs = require('fs');
    var extensionLinkPath = path.join(userProps.firefoxProfilePath, "extensions", firefoxExtensionId); 
    var absoluteBuildPath = path.join(path.resolve(buildPath), 'firefox');
    
    fs.writeFileSync(extensionLinkPath, absoluteBuildPath);
});

gulp.task('kill:firefox', function () {
    if (!isWindows) return;
    var deferred = Q.defer();
    var exec = require('child_process').exec;
    var cmd = 'wmic Path win32_process Where "CommandLine Like \'%'+userProps.firefoxProfilePath.replace(/\\/g,"\\\\")+'%\'" Call Terminate';
    
    exec(cmd, function () { deferred.resolve(); });
    return deferred.promise;
});

gulp.task('run:firefox', ['kill:firefox'], function () {
    var exec = require('child_process').exec;
    var cmd = '"C:\\Program Files (x86)\\Mozilla Firefox\\firefox"';
    if (userProps.openUrl && userProps.openUrl.length > 0) cmd += ' ' + userProps.openUrl;
    cmd += ' -profile '+userProps.firefoxProfilePath+' -no-remote -purgecaches -jsconsole';
    
    exec(cmd, function () {});
});

gulp.task('lint', function () {
    return gulp.src(['src/**/*.js', '!src/chrome/content/Underscore.js'])
               .pipe(jshint({ esnext: true }))
               .pipe(jshint.reporter('default'));
});

gulp.task('clean', function () {
    del.sync([buildPath, distPath]);
});

gulp.task('build:firefox', ['clean'], function() {      
    var rdfFilter = filter('install.rdf');

    return gulp.src("src/**")
               .pipe(rdfFilter)
               .pipe(xmlEditor(function (xml) {
                    var versionNode = xml.get("//em:version", {'em': 'http://www.mozilla.org/2004/em-rdf#'});
                    versionNode.text(pkg.version);
                    return xml;
                }))
               .pipe(rdfFilter.restore())
               .pipe(gulp.dest(path.join(buildPath, "firefox")));
});

gulp.task('dist:firefox', ['build:firefox'], function() {  
    return gulp.src("build/firefox/**")
               .pipe(gulp.dest(path.join(distPath, "firefox")))
               .pipe(zip(firefoxPackageFileName))
               .pipe(gulp.dest(distPath));
});

gulp.task('default', ['build:firefox', 'run:firefox']);
