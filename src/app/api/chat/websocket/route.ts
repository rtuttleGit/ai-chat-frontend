/**
 * Handles the POST request by forwarding the data to an external backend API.
 * Expects a JSON object in the request body containing the fields `selectedId`, `content`, and `role`.
 *
 * @param {Request} req - The incoming HTTP request object.
 * @return {Promise<Response>} Returns a response object reflecting the outcome of the operation.
 */
export async function POST(req: Request) {
    const local = "http://localhost:8080";
    const prod = "https://api.matrixwarp.com";
    const body = await req.json()
    const {selectedId, content, role} = body;
    const response = await fetch(`${prod}/chat/websocket`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "id": selectedId,
            "content": content,
            "role": role,
        }),
    })

    if (!response.ok) {
        console.error('Backend error:', response.status, response.statusText)
        return new Response(`Backend error: ${response.status}`, {status: response.status})
    }
    return new Response(response.body, {status: response.status})
}