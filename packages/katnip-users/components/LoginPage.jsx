import {katnip, A, renderNode} from "katnip";

export default function LoginPage({renderMode}) {
	if (renderMode=="ssr")
		return;

	let user=katnip.useCurrentUser();
	let authMethods=katnip.useChannel("authMethods");
	let postloginpath=katnip.useChannel("postloginpath");

	if (user) {
		katnip.setLocation(postloginpath);
		return;
	}

	let items=[];
	authMethods.sort((a,b)=>a.priority-b.priority);

	for (let authMethod of authMethods) {
		if (authMethod.element) {
			items.push(renderNode({type: authMethod.element}));
		}

		else {
			items.push(
				<A class="btn btn-danger mb-3" style="width: 100%" href={authMethod.href}>
					<b>Login With {authMethod.title}</b>
				</A>
			);
		}
	}

	return (
		<div style="max-width: 20rem; margin-left: auto; margin-right: auto" class="mt-5">
			{items}
		</div>
	);
}