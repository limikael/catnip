import {katnip} from "katnip";
import User, {UserAuthMethod} from "../../src/User.js";

katnip.addAction("authMethods",(authMethods, req)=>{
	authMethods.push({
		id: "email",
		title: "Email and Password",
		element: "PasswordLoginElement",
		href: "/linkemail",
		priority: 10
	});
});

katnip.addApi("/api/login",async (req)=>{
	let {email, password}=req.query;

	let user=await katnip.db.User.findOneByAuth("email", email);

	if (!user)
		throw new Error("Bad credentials.");

	await user.populateAuthMethods();
	user.authMethods["email"].assertPassword(password);
	await katnip.setSessionValue(req.sessionId,user.id);

	return user;
});

katnip.addApi("/api/signup",async (req)=>{
	let {email, password, repeatPassword}=req.query;

	if (await User.findOneByAuth("email",email))
		throw new Error("The email is already in use");

	if (!email)
		throw new Error("Invalid email");

	if (password!=repeatPassword)
		throw new Error("The passwords don't match");

	let user=req.getUser();
	if (!user) {
		user=new katnip.db.User();
		user.role="user";
		await user.save();
	}

	let userAuthMethod=new UserAuthMethod({
		userId: user.id,
		method: "email",
		token: email
	});

	userAuthMethod.setPassword(password);
	await userAuthMethod.save();

	await katnip.setSessionValue(req.sessionId,user.id);
	await user.populateAuthMethods();

	return user;
});
