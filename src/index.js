/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const CONTACTS="https://www.simplelists.com/api/2/contacts/"

export default {
	async fetch(request, env) {
		// Only allow POST requests
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		// Require authorization
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || authHeader !== `Bearer ${env.WORKER_AUTH_TOKEN}`) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Parse the incoming JSON body from JotForm
		let body;
		try {
			body = await request.json();
		} catch (e) {
			return new Response('Invalid JSON body', { status: 400 });
		}

		// Extract the email address — adjust the field name to match
		// whatever JotForm sends (check webhook.site if unsure)
		const email = body.emails || body.email || body.submitter_email;
		const lists = body.lists;
		const firstname = body.firstname;


		if (!email) {
			return new Response('No email found in payload', { status: 400 });
		}

		// Try to GET the contact from Simplelists
		const contactUrl = `${CONTACTS}?email=${encodeURIComponent(email)}`;
		const simplelistsResponse = await fetch(contactUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${env.SIMPLELISTS_API_TOKEN}`,
			},
		});

		// If we get a 404, then create a new contact with
		// Firstname and Email and List subscription
		if (simplelistsResponse.status === 404) {
			const createBody = new URLSearchParams({
				firstname: firstname || '',
				lists: lists || '',
				emails: email,
			});

			const createResponse = await fetch(CONTACTS, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.SIMPLELISTS_API_TOKEN}`,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: createBody,
			});

			const createResponseText = await createResponse.text();
			return new Response(createResponseText, {
				status: createResponse.status,
			});
		}

		// If we get a 200, then use PUT to just update the
		// Contact with the additional list

		// Return the Simplelists response status back to JotForm
		const responseText = await simplelistsResponse.text();
		return new Response(responseText, {
			status: simplelistsResponse.status,
		});
	},
};
