"use client";

import { useState } from "react";

export default function RegisterPage() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const res = await fetch("/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: "john",
				email: "john@example.com",
				password: "12345678",
			}),
		});

		const data = await res.json();
		console.log(data);

		console.log("Status:", res.status);
		console.log("Response:", data);

		if (res.ok) {
			alert("Registered successfully!");
		} else {
			alert(data.message ?? "Registration failed.");
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				placeholder="Username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
			/>

			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>

			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>

			<button type="submit">Register</button>
		</form>
	);
}
