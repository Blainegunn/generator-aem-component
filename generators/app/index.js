'use strict';

/**
 * Yeoman generator that creates all starter files for new AEM components.
 *
 * This includes:
 * - HTML/HTL/Sightly File
 * - JavaScript file
 * - Less file
 * - Wiring up JavaScript and Less
 */

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var wiring = require('html-wiring');
var pathExists = require('path-exists');
var find = require('find');
var pkg = require('./../../../package.json');

var appJs = pkg.paths.scripts;
var appLess = pkg.paths.styles;

var lessPath = pkg.paths.lessPath;
var jsPath = pkg.paths.jsPath;
var javaPath = pkg.paths.javaPath;
var htlPath = pkg.paths.htlPath;

module.exports = yeoman.Base.extend({

  initializing: function() {
    if (!pathExists.sync(appJs)) {
      this.env.error('ERROR: Are you sure your in the right location? Could not find ' + appJs);
    }
    if (!pathExists.sync(appLess)) {
      this.env.error('ERROR: Are you sure your in the right location? Could not find ' + appLess);
    }
  },

  prompting: function() {
    var done = this.async();
    var generator = this;

    this.log(yosay(
      'Welcome to the ' + chalk.red('???????') + ' generator! \nI create stub files for new AEM components.'
    ));

    var prompts = [{
      type: 'input',
      name: 'componentNameCamel',
      message: 'What is the name of the component (lowerCamelCase)?',
      validate: function(componentNameCamel) {
        if (!/^[a-z]+([A-Z0-9][a-z0-9]+[A-Za-z0-9])*$/.exec(componentNameCamel)) {
          return 'Invalid name [' + componentNameCamel + '], name must be lowerCamelCase.';
        }
        return true;
      }
    }, {
      type: 'input',
      name: 'componentNameDashed',
      message: 'What is the name of the component (with-dashes-all-lowercase)?',
      validate: function(componentNameDashed) {
        if (!/^[a-z\-]+$/.exec(componentNameDashed)) {
          return 'Invalid name [' + componentNameDashed + '], all lowercase and dashes.';
        }
        return true;
      }
    }, {
      type: 'list',
      name: 'style',
      message: 'Do you want to include styles?',
      choices: [
        {name: chalk.green('Yes'), value: 'yes'},
        {name: chalk.red('No'), value: 'no'}
      ]
    }, {
      type: 'list',
      name: 'scripts',
      message: 'Do you want to include javascript?',
      choices: [
        {name: chalk.green('Yes'), value: 'yes'},
        {name: chalk.red('No'), value: 'no'}
      ]
    }];

    this.prompt(prompts).then(function(props) {
      this.props = props;

      this.log(chalk.cyan('Look at what you made:'));

      this.props.folderName = this.props.componentNameCamel;
      this.log('folderName:\t\t' + chalk.blue(this.props.folderName));

      this.props.lessName = this.props.componentNameDashed;

      if (props.scripts == 'yes'){
        this.props.jsFileName = this.props.componentNameCamel;
        this.log('jsFileName:\t\t' + chalk.blue(this.props.jsFileName));
      }

      this.props.xmlContentName = nameSpacer(this.props.lessName);
      this.log('contentTitle:\t\t' + chalk.blue(this.props.xmlContentName));


      this.props.htlName = this.props.componentNameCamel;
      this.props.htlTemplateName = 'render' + capitalizeFirstLetter(this.props.componentNameCamel);
      this.props.htlPath = true;
      this.log('htlName:\t\t' + chalk.blue(this.props.htlName));
      this.log('htlTemplateName:\t' + chalk.blue(this.props.htlTemplateName));


      if (props.style == 'yes') {
        this.props.lessFileName = this.props.componentNameCamel;
        this.log('lessName:\t\t' + chalk.blue(this.props.lessName));
        this.log('lessFileName:\t\t' + chalk.blue(this.props.lessFileName));
      }

      // Final confirmation prompt
      this.prompt([{
        type    : 'confirm',
        name    : 'continue',
        default : false,
        message : 'Does this look correct?'
      }]).then(function(props) {
        if (!props.continue) {
          this.log(chalk.yellow('Quiting: Try again with the correct inputs.'));
          process.exit(1);
        }
        done();
      }.bind(this));

    }.bind(this));
  },

  writing: function() {

    /*
     * LESS FILE
     */
     if(this.props.lessFileName) {
       this.fs.copyTpl(
         this.templatePath('componentLess.less'),
         this.destinationPath(path.join(lessPath, this.props.folderName, this.props.lessFileName + '.less')),
         this.props
       );
     }

    /*
     * JS FILE
     */
    this.fs.copyTpl(
      this.templatePath('componentJavaScript.js'),
      this.destinationPath(path.join(jsPath, this.props.folderName, this.props.jsFileName + '.js')),
      this.props
    );

    /*
     * JAVA FILE TODO
     */

    /*
     * HTL & .CONTENT FILE
     */
    if (this.props.htlPath) {
      this.fs.copyTpl(
        this.templatePath('htl.html'),
        this.destinationPath(path.join(htlPath, this.props.folderName, this.props.jsFileName + '.html')),
        this.props
      );
      this.fs.copyTpl(
        this.templatePath('content.xml'),
        this.destinationPath(path.join(htlPath, this.props.folderName, '/_cq_dialog/.content.xml')),
        this.props
      );
    }

    /*
     * UPDATE APP.LESS INDEX
     */
    var lessToAdd = '@import "' + this.props.folderName + '/' + this.props.lessFileName + '";\n';
    var lessContent = wiring.readFileAsString(appLess);
    if (!lessContent.includes(lessToAdd)) {
      this.log(chalk.yellow('Updating ') + appLess);

      lessContent = lessContent + lessToAdd;
      wiring.writeFileFromString(lessContent, appLess);
    } else {
      this.log(chalk.cyan('Skipping ') + appLess + ' update');
    }

  }
});


/*
 * START HELPER FUNCTIONS
 */

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function nameSpacer(string) {
  return string.split('-').join(' ');
}
