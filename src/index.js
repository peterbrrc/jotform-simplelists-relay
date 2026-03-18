/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env) {

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

	// Require authorization 
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${env.WORKER_AUTH_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Parse the incoming JSON body from JotForm
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response("Invalid JSON body", { status: 400 });
    }

    // Extract the email address — adjust the field name to match
    // whatever JotForm sends (check webhook.site if unsure)
    const email = body.emails || body.email || body.submitter_email;

    if (!email) {
      return new Response("No email found in payload", { status: 400 });
    }

    // Forward to Simplelists as application/x-www-form-urlencoded
    //      "Authorization": `Bearer ${env.SIMPLELISTS_API_TOKEN}`,
    const simplelistsResponse = await fetch(
      "https://www.simplelists.com/api/2/contacts/",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer VTbDSKE7NFbR8ihV96cT2z7kL5J3QZHP",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ emails: email }).toString(),
      }
    );

    // Return the Simplelists response status back to JotForm
    const responseText = await simplelistsResponse.text();
    return new Response(responseText, {
      status: simplelistsResponse.status,
    });
  },
};
