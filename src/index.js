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

		console.log('Extracted from JotForm:', { email, lists, firstname });

		// Try to GET the contact from Simplelists
		const contactUrl = `${CONTACTS}?email=${encodeURIComponent(email)}`;
		console.log('Making GET request to:', contactUrl);
		const simplelistsResponse = await fetch(contactUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${env.SIMPLELISTS_API_TOKEN}`,
			},
		});
		console.log('GET response status:', simplelistsResponse.status);

		// If we get a 404, then create a new contact with
		// Firstname and Email and List subscription
		if (simplelistsResponse.status === 404) {
			const createBody = new URLSearchParams({
				firstname: firstname || '',
				lists: lists || '',
				emails: email,
			});
			console.log('Contact not found (404), creating new contact with body:', createBody.toString());

			const createResponse = await fetch(CONTACTS, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.SIMPLELISTS_API_TOKEN}`,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: createBody,
			});
			console.log('POST response status:', createResponse.status);

			const createResponseText = await createResponse.text();
			console.log('POST response body:', createResponseText);
			return new Response(createResponseText, {
				status: createResponse.status,
			});
		}

		// If we get a 200, then use PUT to just update the
		// Contact with the additional list

		// Return the Simplelists response status back to JotForm
		const responseText = await simplelistsResponse.text();
		console.log('Returning GET response to JotForm:', { status: simplelistsResponse.status, body: responseText });
		return new Response(responseText, {
			status: simplelistsResponse.status,
		});
	},
};
