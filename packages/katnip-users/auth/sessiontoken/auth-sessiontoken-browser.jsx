import {katnip, useChannel, A} from "katnip";
import SessionTokenPage from "./SessionTokenPage.jsx";
import SessionTokenTab from "./SessionTokenTab.jsx";

katnip.addRoute("sessiontoken",SessionTokenPage);

function SessionTokenLoginButton() {
	let authSessionTokenEnable=(String(useChannel("authSessionTokenEnable"))=="true");

	if (!authSessionTokenEnable)
		return;

	return (
		<A class="btn btn-danger mb-3" style="width: 100%" href="/sessiontoken">
			<b>Use Session Token</b>
		</A>
	);
}

katnip.addAction("loginPageItems",(items)=>{
	items.push(<SessionTokenLoginButton/>);
});

katnip.addAction("getAccountTabs",(accountTabs, user)=>{
	if (user.token)
		accountTabs.push({
			title: "Session Token",
			component: SessionTokenTab,
			priority: 20,
		});
});
