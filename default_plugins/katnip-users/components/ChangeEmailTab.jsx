import {katnip, PromiseButton, BsAlert, useForm, delay, quest, useCounter,
		useCurrentUser, setCurrentUser} from "katnip";
import {useState} from "react";

export default function ChangeEmailTab() {
	let user=useCurrentUser();
	let [counter, invalidate]=useCounter();
	let form=useForm({initial: {email: user.email}, deps: [counter]});
	let [message, setMessage]=useState();

	async function onChangeEmailClick() {
		setMessage();
		let newEmail=values.email;
		await quest("/api/changeEmail",{query: form.getCurrent()});
		setMessage("Your email has been changed.");

		user.email=newEmail;
		setCurrentUser(user);
		invalidate();
	}

	return (
		<form>
			<BsAlert message={message} ondismiss={setMessage}/>
			<div class="mb-3" >
				<label class="form-label">New Email</label>
				<input type="text" class="form-control"
						{...field("email")}/>
			</div>
			<div class="mb-3" >
				<label class="form-label">Password</label>
				<input type="password" class="form-control"
					{...field("password")}/>
			</div>
			<PromiseButton class="btn btn-primary mt-3"
					onclick={onChangeEmailClick}
					onerror={setMessage}>
				Change Email
			</PromiseButton>
		</form>
	);
}
