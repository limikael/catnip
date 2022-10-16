import * as readline from 'node:readline';
import fs from "fs";
import child_process from "child_process";
import {getKatnipDir} from "../main/katnip-main-util.js";
import path from "path";

class KatnipScaffolder {
	constructor(options) {
		this.options=options;
		if (options.name)
			this.projectName=options.name;
	}

	question(prompt) {
		return new Promise((resolve)=>{
			let rl=readline.createInterface({input: process.stdin,output: process.stdout});
			rl.question(prompt,(answer)=>{
				rl.close();
				resolve(answer);
			});
		})
	}	

	generatePackageJson() {
		let dir=path.dirname(new URL(import.meta.url).pathname);
		let basePkg=JSON.parse(fs.readFileSync(dir+"/../../package.json"));
		let version=basePkg.version;

		let pkg={
			"name": this.projectName,
			"scripts": {
				"start": "katnip start",
			},
			"dependencies": {
				"katnip": "^"+version
			},
			"main": "src/"+this.projectName+"-main.js",
			"browser": "src/"+this.projectName+"-browser.jsx",
			"type": "module"
		};

		return pkg;
	}

	exec(cmd, params=[]) {
		return new Promise((resolve, reject)=>{
			let proc=child_process.spawn(cmd,params,{stdio: "inherit"});
			proc.on("exit",(code)=>{
				if (code)
					reject("Command failed with code: "+code);

				resolve();
			});
		});
	}

	async run() {
		if (!this.projectName)
			this.projectName=await this.question("Project name: ");

		if (fs.existsSync(this.projectName))
			throw new Error("Folder already exists!");

		console.log("Creating project "+this.projectName);
		fs.mkdirSync(this.projectName);
		let packageContent=JSON.stringify(this.generatePackageJson(),null,2);
		fs.writeFileSync(this.projectName+"/package.json",packageContent);

		fs.mkdirSync(this.projectName+"/src");
		fs.writeFileSync(this.projectName+"/src/"+this.projectName+"-main.js",'import {katnip} from "katnip"; \n\n// Server stuff');
		fs.writeFileSync(this.projectName+"/src/"+this.projectName+"-browser.jsx",'import {katnip} from "katnip"; \n\n// Client stuff');

		if (!this.options.install)
			this.options.install="npm";

		if (this.options.install!="none") {
			let oldDir=process.cwd();
			process.chdir(this.projectName);

			await this.exec(this.options.install,["install"]);

			if (!this.options["no-start"]) {
				console.log("Installed! Entering interactive setup...");
				await this.exec("yarn",["start"]);
			}

			else {
				console.log("Done!");
			}

			process.chdir(oldDir);
		}
	}
}

export async function create(options, name) {
	if (getKatnipDir()) {
		console.log("Already inside a project dir!");
		process.exit();
	}

	if (name)
		options.name=name;

	let scaffolder=new KatnipScaffolder(options);
	await scaffolder.run();
}

create.optional=["name"];
create.desc="Create a new katnip project.";
create.args={
	name: {desc: "Project name."},
	"no-start": {desc: "Do not start katnip after installation."},
	install: {desc: "Use npm/yarn/none to install the project."},
}

