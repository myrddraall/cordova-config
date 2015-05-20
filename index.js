'use strict';

/**
 * This module represents the config.xml file.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  20 May 2015
 */

// module dependencies
var fs = require('fs'),
    et = require('elementtree');

module.exports = (function() {

    var _this = {
        /**
         * This method parses the xml file provided.
         *
         * @param  {string}      file The XML file that should be parsed.
         * @return {ElementTree}      The XML document.
         */
        parse: function(file) {
            var contents = fs.readFileSync(file, 'utf-8');

            if(contents) {
                //Windows is the BOM. Skip the Byte Order Mark.
                contents = contents.substring(contents.indexOf('<'));
            }

            var doc = new et.ElementTree(et.XML(contents)),
                root = doc.getroot();

            if(root.tag !== 'widget') {
                // Throw an error if widget is not the root tag
                throw new Error('config.xml has incorrect root node name (expected "widget", was "' + root.tag + '")');
            }

            return doc;
        }
    };

    /**
     * Creates a new Config object.
     *
     * @param {string} file The path to the XML config file.
     */
    function Config(file) {
        this._file = file;
        this._doc = _this.parse(file);
        this._root = this._doc.getroot();
    }

    /**
     * Adds or updates the preference `name` with the
     * @param {string} name  The name of the preference.
     * @param {*}      value The value of the preference.
     */
    Config.prototype.setPreference = function(name, value) {
        // Retrieve the correct preference
        var preference = this._doc.find('./preference/[@name="' + name + '"]');

        if(preference) {
            // If the preference already exists, remove it first
            this._root.remove(preference);
        }

        // Create the preference element
        preference = new et.Element('preference');
        preference.attrib.name = name;
        preference.attrib.value = value;

        // Append the preference to the root tag
        this._root.append(preference);
    };
    
    /**
     * Removes all the <access /> tags out of the config file.
     */
    Config.prototype.removeAccessOrigins = function() {
        var ao;
        
        while(ao = this._doc.find('./access')) {
            // Remove all the access tags untill there are no tags left
            this._root.remove(ao);
        }
    };
    
    /**
     * Adds a new <access /> tag to the XML file. If an access tag with that origin
     * already exist, it will be overwritten.
     * 
     * @param {string} origin       The origin of the access tag.
     * @param {object} [options]    Extra properties that should be added to the access tag.
     */
    Config.prototype.setAccessOrigin = function(origin, options) {
        options = options || {};
        
        var accessOrigin = this._doc.find('./access/[@origin="' + origin + '"]');
        
        if(accessOrigin) {
            // If the access tag allready exist, remove it
            this._root.remove(accessOrigin);
        }
        
        // Create an access tag
        accessOrigin = new et.Element('access');
        accessOrigin.attrib.origin = origin;
        
        for(var key in options) {
            // Iterate over the options object and add the properties
            accessOrigin.attrib[key] = options[key];
        }
        
        // Add the access tag to the root
        this._root.append(accessOrigin);
    };

    /**
     * Writes the config file async.
     *
     * @param  {function} cb The callback function invoked when the file is written.
     */
    Config.prototype.write = function(cb) {
        fs.writeFile(this._file, this._doc.write({indent: 4}), 'utf-8', cb);
    };

    /**
     * The same as `write` but sync.
     */
    Config.prototype.writeSync = function() {
        fs.writeFileSync(this._file, this._doc.write({indent: 4}), 'utf-8');
    };

    return Config;
})();