const express = require('express');
const path = require("path");
const fileUpload = require('express-fileupload');
const app = express();
var tools = require('./obf');
var unzipper = require('unzipper');
var fs = require('fs');
const fsExtra = require('fs-extra')
var zl = require("zip-lib");

fsExtra.emptyDirSync("data/staging")
fsExtra.emptyDirSync("data/input")
fsExtra.emptyDirSync("data/output")
fs.writeFileSync(path.join(__dirname, '/data/cache.json'), "[]");
// Download file name extension
var dlfext = "-obfuscated-by-JJTV"

var uid = 0
var queue = []

app.use(fileUpload({
	limits: {
        fileSize: 5000000 // 5MB
    },
    abortOnLimit: true
}));

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.post('/upload', function(req, res) {
	id = uid
	try{
		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send('No files were processed.');
		}
		let sampleFile = req.files.fileUploaded;
		console.log(sampleFile);
		if (sampleFile.mimetype != "application/x-zip-compressed" && sampleFile.mimetype != "application/zip")
			return res.status(400).send('Only ZIP Files allowed');

		// Check Cache
		cache = fs.readFileSync(path.join(__dirname, '/data/cache.json'));
		for (x of JSON.parse(cache)){
			if (x.md5 == sampleFile.md5){
				return res.download(x.dir)
			}
			console.log(x);
		}
		
		sampleFile.mv(path.join(__dirname, '/data/input/'+id+".zip"));
		uid += 1
		
		dr = path.join(__dirname, '/data/staging/'+id+"/")
		if (!fs.existsSync(dr)){
	    	fs.mkdirSync(dr, { recursive: true });
		}
		dr = path.join(__dirname, '/data/output/'+id+"/")
		if (!fs.existsSync(dr)){
	    	fs.mkdirSync(dr, { recursive: true });
		}

		var filname = sampleFile.name.split('.')[0];
		filname += dlfext

		setTimeout(function(){
			// Extract Files
			fs.createReadStream(path.join(__dirname, '/data/input/'+id+".zip")).pipe(unzipper.Extract({ path: path.join(__dirname, '/data/staging/'+id) })).on('close', function () {
				// AFTER EXTRACTION SUCESSFULY
				// Obfuscate and send to user on sucess
				tools.obfuscateDir(path.join(__dirname, '/data/staging/'+id));
				zl.archiveFolder(path.join(__dirname, '/data/staging/'+id), path.join(__dirname, '/data/output/'+id+"/"+filname+".zip")).then(function () {
					console.log("Finished! Sending file back...")
					res.download(path.join(__dirname, '/data/output/'+id+"/"+filname+".zip"))
		
					//CLEANING UP
					fs.rmSync(path.join(__dirname, '/data/staging/'+id), { recursive: true, force: true });
					fs.unlinkSync(path.join(__dirname, '/data/input/'+id+".zip"));
					rawcache = fs.readFileSync(path.join(__dirname, '/data/cache.json'));
					js = JSON.parse(rawcache)
					js.push({"md5": sampleFile.md5, "dir": path.join(__dirname, '/data/output/'+id+"/"+filname+".zip")})
					fs.writeFileSync(path.join(__dirname, '/data/cache.json'), JSON.stringify(js));
					
				}, function (err) {
					console.log(err);
				});
			});
		}, 500);

	}
	catch (error){
		console.log(error);
		return res.status(400).send('An error ocurred! Try again!');
	}
});


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/favicon.ico', function(req, res){
	res.sendFile(path.join(__dirname, '/favicon.ico'));
})

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

app.listen(3000, () => console.log(`Obfuscator listening on port 3000!`));