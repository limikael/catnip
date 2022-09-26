import {katnip} from "katnip";

katnip.addApi("/api/getPageView",async (req)=>{
	let {query}=req.query;

	let page=await katnip.db.Page.findOne({
		$op: "or",
		slug: query,
		id: query
	});

	if (!page)
		throw new Error("NOT FOUND")

	return page;
})

katnip.addChannel("numPages",async ()=>{
	return await katnip.db.Page.getCount();
});

katnip.addChannel("pageContent",async (req)=>{
	let {id}=req.query;

	return await katnip.db.Page.findOne(id);
});
