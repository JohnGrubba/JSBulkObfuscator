const path = require("path");
var fs = require('fs');
var JavaScriptObfuscator = require('javascript-obfuscator');

var settings = {
	"compact": true,
	"controlFlowFlattening": true,
	"controlFlowFlatteningThreshold": 1,
	"numbersToExpressions": true,
	"simplify": false,
	"shuffleStringArray": true,
	"splitStrings": true,
	"stringArrayThreshold": 1
}
module.exports = {
	obfuscateDir: function (dirPath) {
	    var dirents = fs.readdirSync(dirPath, { encoding: "utf8", withFileTypes: true 		});
	    for (let i = 0; i < dirents.length; i++){
	        let dirent = dirents[i];
	        
	        if (dirent.isDirectory()){
	            module.exports.obfuscateDir(path.join(dirPath, dirent.name));
	            continue;
	        }
	
	        if (path.extname(dirent.name) != ".js") continue;
	
	        let filePath = path.join(dirPath, dirent.name);
			console.log("Obfuscating " + filePath)
	        let content = fs.readFileSync(filePath, { encoding: "utf8" });
			
	        let obfuscator = JavaScriptObfuscator.obfuscate(content, settings);
	        let obfuscatedCode = obfuscator.getObfuscatedCode();
	
	        fs.writeFileSync(filePath, obfuscatedCode, { encoding: "utf8", flag: "w+"			});
	    }
	}
}