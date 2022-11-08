import {isSsr, usePromise, BsAlert, useChannel} from "katnip";

export function Lazy(props) {
	if (isSsr())
		return (<div class="spinner-border m-3"/>);

	let bundleHash=useChannel("bundleHash");
	let importFn="/"+props.module+".mjs?hash="+bundleHash;
	let bundle=usePromise(async ()=>{
		return await import(importFn);
	});

	if (bundle===undefined)
		return (<div class="spinner-border m-3"/>);

	if (bundle instanceof Error)
		return <BsAlert message={bundle}/>

	let Component=bundle[props.symbol];
	if (!Component) {
		let e=new Error("Undefined symbol '"+props.symbol+"' in module '"+importFn+"'.");
		return <BsAlert message={e}/>
	}

	let p={...props};
	delete p.module;
	delete p.symbol;

	return <Component {...p}/>;
}

export function lazyComponent(module, symbol) {
	return (props)=><Lazy module={module} symbol={symbol} {...props}/>;
}