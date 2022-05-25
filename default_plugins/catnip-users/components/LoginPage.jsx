import {catnip, A, ItemList, apiFetch, ItemForm, setLocation, buildUrl} from "catnip";
import {useForm, useCounter, useApiFetch, useValueChanged} from "catnip";
import {useRef, useState} from "preact/compat";

export default function LoginPage() {
	const loginRef=useRef();
	const passwordRef=useRef();
	let [message, setMessage]=useState();
	let [session, setSession]=catnip.useSession();

	async function onLoginClick() {
		setMessage();

		try {
			let u=await catnip.apiFetch("/api/login",{
				login: loginRef.current.value,
				password: passwordRef.current.value
			});

			setSession(u);
			catnip.setLocation(session.postloginpath);
		}

		catch (e) {
			setMessage(e.message);
		}
	}

	let messageEl;
	if (message)
		messageEl=(
			<div class="text-danger text-center"><b>{message}</b></div>
		);

	return (
		<div class="mt-5 ms-auto me-auto" style="width: 100%; max-width: 20rem">
			<div class="card border shadow mb-4">
				<div class="card-body">
					<h3 class="text-center mb-3">Login</h3>

					<form class="mb-2">
						<input type="text" class="form-control mb-3" placeholder="Username / Email" ref={loginRef}/>
						<input type="password" class="form-control" placeholder="Password" ref={passwordRef}/>
					</form>

					{messageEl}

					<button class="btn btn-primary mb-2 mt-2" style="width: 100%"
							onclick={onLoginClick}>
						Login
					</button>
					<A href="/signup" class="d-block small text-muted text-center" style="width: 100%"><b>No account? Sign Up!</b></A>
				</div>
			</div>
			{session.googleAuthUrl &&
				<a class="btn btn-danger mb-2" style="width: 100%" href={session.googleAuthUrl}>
					<b>Sign in with Google</b>
				</a>
			}
		</div>
	);
}
