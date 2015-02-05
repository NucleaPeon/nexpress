/**
 * Reads and modifies tags with the desired data.
 * Performs validation checks for key/value pairs so methods get
 * called and strings get returned.
 *
 */

var parseList = [null, 'html']; // null defaults to parsing if file extension isn't known
var re = /{{(.*?)}}/g;

var replaceWith = function(word, json) {
    // Check if value is quoted (a string) or non-quoted (json key -- can be function)
    var replwith = word.replace(/{{/g, '');
    replwith = replwith.replace(/}}/g, '');
    replwith = replwith.trim();
    if ((replwith[0] == '"') && (replwith[replwith.length-1] == '"')) {
        replwith = replwith.replace(/"/g, '');
    }
    else {
        if (json[replwith] !== undefined) {
            return (json[replwith] instanceof Function) ? json[replwith]() : json[replwith];
        }
    }
    return replwith;
}

this.parseData = function(fileext, data, json) {
    data = data.toString('utf8');
    for (var i=0; i < parseList.length; i++) {
        if (fileext == parseList[i]) {
            var slice = '';
            var index = 0;
            var myArray = data.match(re);
            if ((myArray !== undefined) && (myArray !== null)) {

                for(var i=0; i < myArray.length; i++) {
                    index = data.indexOf(myArray[i]);
                    slice = data.slice(index, index + myArray[i].length);
                    data = data.replace(slice, replaceWith(myArray[i], json));
                }
            }
            data = data.toString('binary');
            break;
        }
        else {
            console.log("extension not in array: " + fileext);
        }
    }
    return data;

}