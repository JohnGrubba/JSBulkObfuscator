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

var id = 0
var queue = []

app.use(fileUpload({
	limits: {
        fileSize: 5000000 // 5MB
    },
    abortOnLimit: true
}));

app.post('/upload', function(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were processed.');
	}
	let sampleFile = req.files.fileUploaded;
	if (sampleFile.mimetype != "application/x-zip-compressed")
		return res.status(400).send('Only ZIP Files allowed');
	console.log(sampleFile)
	
	sampleFile.mv(path.join(__dirname, '/data/input/'+id+".zip"));
	
	dr = path.join(__dirname, '/data/staging/'+id+"/")
	if (!fs.existsSync(dr)){
    	fs.mkdirSync(dr, { recursive: true });
	}
	
	// Extract Files
	fs.createReadStream(path.join(__dirname, '/data/input/'+id+".zip")).pipe(unzipper.Extract({ path: path.join(__dirname, '/data/staging/'+id) })).on('close', function () {
		// AFTER EXTRACTION SUCESSFULY
		// Obfuscate and send to user on sucess
		tools.obfuscateDir(path.join(__dirname, '/data/staging/'+id));
		zl.archiveFolder(path.join(__dirname, '/data/staging/'+id), path.join(__dirname, '/data/output/'+id+".zip")).then(function () {
			console.log("Finished! Sending file back...")
			res.download(path.join(__dirname, '/data/output/'+id+".zip"))

			//CLEANING UP
			fs.rmSync(path.join(__dirname, '/data/staging/'+id), { recursive: true, force: true });
			fs.unlinkSync(path.join(__dirname, '/data/input/'+id+".zip"));
			id += 1
		}, function (err) {
			console.log(err);
		});
	});
});


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(3000, () => console.log(`Obfuscator listening on port 3000!`));