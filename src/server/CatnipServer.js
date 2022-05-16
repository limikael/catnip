import http from "http";
import {build} from "../utils/esbuild-extra.js";
import fs from "fs";
import CatnipRequestHandler from "./CatnipRequestHandler.js";
import CatnipChannelHandler from "./CatnipChannelHandler.js";
import {createOutDir, getPluginPaths} from "./catnip-server-util.js";
import crypto from "crypto";

export default class CatnipServer {
	constructor(options) {
		this.options=options;
	}

	async build() {
		if (!this.options.minify)
			this.options.minify=false;

		this.outDir=await createOutDir();
		console.log("Building in: "+this.outDir+" minify: "+this.options.minify);

		if (!fs.existsSync("node_modules/react"))
			fs.symlinkSync("preact/compat","node_modules/react","dir");

		let stat=fs.lstatSync("node_modules/react");
		if (!stat.isSymbolicLink())
			throw new Error("react is not a link");

		try {
			await build({
				multiBundle: true,
				include: Object.values(getPluginPaths()),
				expose: {
					catnip: `${process.cwd()}/node_modules/catnip`
				},
				inject: [`${process.cwd()}/node_modules/catnip/src/utils/preact-shim.js`],
				external: ["mysql"],
				jsxFactory: "h",
				jsxFragment: "Fragment",
				minify: this.options.minify,
				outfile: this.outDir+"/catnip-bundle.js",
				loader: {".svg": "dataurl"}
			});
		}

		catch (e) {
			console.log("Build failed: "+e.message);
			process.exit();
		}

		await import(this.outDir+"/catnip-bundle.js");
		this.catnip=global.catnip;
		this.catnip.db.MySql=await import("mysql");
		global.fetch=(await import("node-fetch")).default;
		global.crypto=crypto;
	}

	async run() {
		await this.build();

		let port=this.options.port;
		if (!port)
			port=3000;

		console.log("Starting...");
		await this.catnip.serverMain(this.options);

		this.requestHandler=new CatnipRequestHandler(this.catnip,this.options);

		let clientBundle=fs.readFileSync(this.outDir+"/catnip-bundle.js")+"window.catnip.clientMain();";
		this.requestHandler.setClientBundle(clientBundle);

		let server=http.createServer(this.requestHandler.handleRequest);
		let channelHandler=new CatnipChannelHandler(this.catnip,server);

		server.listen(port,"0.0.0.0",()=>{
			console.log("Running on port "+port);
		});
	}
}