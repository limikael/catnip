import {quoteAttr, delay, buildUrl} from "../utils/js-util.js";
import {getPluginPaths} from "./katnip-server-util.js";
import fs from "fs";
import crypto from "crypto";
import KatnipRequest from "../lib/KatnipRequest.js";

export default class KatnipRequestHandler {
	constructor(katnip, options) {
		this.katnip=katnip;
		this.options=options;
		this.startTime=Date.now();
	}

	setClientBundle(bundle) {
		this.clientBundle=bundle;
		this.bundleHash=crypto
			.createHash('sha1')
			.update(bundle, 'utf8')
			.digest('hex');
	}

	setContentHash(contentHash) {
		this.contentHash=contentHash;
	}

	computeETag=(entity)=>{
		let hash = crypto
			.createHash('sha1')
			.update(entity, 'utf8')
			.digest('base64')
			.substring(0, 27)

		let len = typeof entity==='string'
			?Buffer.byteLength(entity,'utf8')
			:entity.length

		return '"' + len.toString(16) + '-' + hash + '"';
	}

	handleContent=(req, res, content, headers)=>{
		headers["ETag"]=this.computeETag(content);

		let len=typeof content==='string'
			?Buffer.byteLength(content,'utf8')
			:content.length

		headers["Content-Length"]=len;

		if (!headers["Cache-Control"])
			headers["Cache-Control"]="public, max-age=0";

		if (req.headers["if-none-match"]==headers["ETag"]) {
			res.writeHead(304,headers);
			res.end();
			return;
		}

		res.writeHead(200,headers);
		res.end(content);
	}

	getFileMimeType(fn) {
		let ext=fn.split('.').pop().toLowerCase();
		let types={
			"jpg": "image/jpeg",
			"jpeg": "image/jpeg",
			"png": "image/png",
			"js": "application/javascript",
			"css": "text/css"
		};

		if (types[ext])
			return types[ext];

		return "application/octet-stream";
	}

	handlePublic=(req, res)=> {
		for (let pluginPath of getPluginPaths()) {
			let cand=pluginPath+"/"+req.pathname;

			if (fs.existsSync(cand)) {
				let mtime=fs.statSync(cand).mtime;
				let headers={
					"Content-Type": this.getFileMimeType(cand),
					"Last-Modified": new Date(mtime).toUTCString()
				};

				if (req.query.contentHash &&
						req.query.contentHash==this.contentHash)
					headers["Cache-Control"]="public, max-age=31536000";

				this.handleContent(req,res,fs.readFileSync(cand),headers);
				return;
			}
		}

		res.writeHead(404);
		res.end("Not found...");
	}

	handleApi=async (req, res)=>{
		if (this.options.apidelay)
			await delay(1000);

		let func=this.katnip.apis[req.pathname];
		if (func) {
			try {
//				let data=await func(req.query,req);
				let data=await func(req);

				res.writeHead(200);
				if (!data)
					data=null;
				res.end(JSON.stringify(data));
				return;
			}

			catch (e) {
				console.log(e);
				res.writeHead(500);
				res.end(JSON.stringify({
					message: e.message
				}));
				return;
			}
		}

		res.writeHead(404);
		res.end(JSON.stringify({
			message: "Not found......."
		}));
	}

	handleDefault=async (req, res, cookie)=>{
		let initChannelIds=[];
		await this.katnip.doActionAsync("initChannels",initChannelIds,req);
		for (let channel of this.katnip.getSettings({session: true}))
			initChannelIds.push(channel.id);

		let initChannels={};
		for (let channelId of initChannelIds)
			initChannels[channelId]=await this.katnip.getChannelData(channelId,req);

		//console.log(JSON.stringify(initChannels));

		let quotedChannels=quoteAttr(JSON.stringify(initChannels));

		res.writeHead(200,{
			"Set-Cookie": `katnip=${req.sessionId}`
		});

		let bundleUrl=buildUrl("/katnip-bundle.js",{
			bundleHash: this.bundleHash
		});

		let clientPage=`<body><html>`;
		clientPage+=`<head>`;
		clientPage+=`<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`;
		clientPage+=`</head>`;
		clientPage+=`<div id="katnip-root"></div>`;
		clientPage+=`<script data-channels="${quotedChannels}" src="${bundleUrl}"></script>`;
		clientPage+=`</html></body>`;

		res.end(clientPage);
	}

	handleRequest=async (nodeReq, res)=>{
		//await delay(1000);
		let req=new KatnipRequest();
		req.processNodeRequest(nodeReq);
		await req.processNodeRequestBody(nodeReq);
		await this.katnip.doActionAsync("initRequest",req);

		try {
			if (req.pathname=="/katnip-bundle.js") {
				let headers={
					"Content-Type": "application/javascript",
					"Last-Modified": new Date(this.startTime).toUTCString()
				};

				if (req.query.bundleHash &&
						req.query.bundleHash==this.bundleHash)
					headers["Cache-Control"]="public, max-age=31536000";

				this.handleContent(req,res,this.clientBundle,headers);
			}

			else if (req.pathargs[0]=="api")
				await this.handleApi(req,res);

			else if (req.pathargs[0]=="public")
				await this.handlePublic(req,res);

			else
				await this.handleDefault(req,res);
		}

		catch (e) {
			console.log(e);
			res.writeHead(500);
			res.end("");
		}
	}	
}