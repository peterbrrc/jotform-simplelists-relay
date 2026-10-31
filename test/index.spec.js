import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src';

describe('JotForm Webhook Handler', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.stubGlobal('fetch', vi.fn());
		// @ts-ignore - Override environment variables
		env.WORKER_AUTH_TOKEN = 'deadbeef';
		env.SIMPLELISTS_API_TOKEN = 'fake-simplelists-token';
	});

	describe('Method Validation', () => {
		it('rejects GET requests with 405', async () => {
			const request = new Request('http://example.com', { method: 'GET' });
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(405);
			expect(await response.json()).toEqual({ error: 'Method not allowed' });
		});

		it('rejects PUT requests with 405', async () => {
			const request = new Request('http://example.com', { method: 'PUT' });
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(405);
		});

		it('rejects DELETE requests with 405', async () => {
			const request = new Request('http://example.com', { method: 'DELETE' });
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(405);
		});

		it('accepts POST requests', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			// Mock Simplelists response - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).not.toBe(405);
		});
	});

	describe('Authorization', () => {
		it('rejects requests without authorization header (401)', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: 'Unauthorized' });
		});

		it('rejects requests with invalid token (401)', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer invalid-token', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: 'Unauthorized' });
		});

		it('accepts requests with valid Bearer token', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			// Mock GET - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
		});
	});

	describe('JSON Parsing', () => {
		it('rejects invalid JSON with 400', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: 'not valid json',
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
		});

		it('accepts valid JSON', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			// Mock GET - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
		});
	});

	describe('Email Extraction', () => {
		it('rejects missing email with 400', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'John Doe' }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: 'No email found in payload' });
		});

		it('extracts email from "emails" field', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			// Mock GET - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
		});

		it('extracts email from "email" field', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@example.com' }),
			});
			// Mock GET - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
		});

		it('extracts email from "submitter_email" field', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ submitter_email: 'test@example.com' }),
			});
			// Mock GET - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
		});
	});

	describe('Simplelists Forwarding', () => {
		it('forwards email to Simplelists API - contact found (PUT)', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com', lists: 'list-admins' }),
			});
			// Mock GET - contact found
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ data: [{ id: 12345 }] }), { status: 200 })
			);
			// Mock PUT response
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ message: 'Contact updated' }), { status: 200 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ message: 'Contact updated' });
		});

		it('returns Simplelists error status', async () => {
			const request = new Request('http://example.com', {
				method: 'POST',
				headers: { Authorization: 'Bearer deadbeef', 'Content-Type': 'application/json' },
				body: JSON.stringify({ emails: 'test@example.com' }),
			});
			// Mock GET - returns error
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(JSON.stringify({ message: 'Duplicate email' }), { status: 409 })
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(409);
			expect(await response.json()).toEqual({ message: 'Duplicate email' });
		});
	});
});
