/**
 * Handles the POST HTTP request to forward the provided message data to an external backend service
 * and streams the processed response back to the client in a custom data format.
 *
 * @param {Request} req - The incoming HTTP Request object, which should contain a JSON body with a `messages` array
 *                        and a `selectedId` identifier.
 * @return {Promise<Response>} The HTTP Response after processing the request. If successful, returns a streaming
 *                             response containing the formatted response from the backend service. If an error
 *                             occurs, returns an error response with an appropriate HTTP status code and message.
 */
export async function POST(req: Request) {
    try {
        const local = "http://localhost:8080";
        const prod = "https://api.matrixwarp.com";
        const body = await req.json()
        const {selectedId} = body;
        const lastMessage = body.messages[body.messages.length - 1];
        const response = await fetch(`${prod}/chat/direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "id": selectedId,
                "content": lastMessage.content,
                "role": lastMessage.role,
            }),
        })

        if (!response.ok) {
            console.error('Backend error:', response.status, response.statusText)
            return new Response(`Backend error: ${response.status}`, {status: response.status})
        }

        const data = await response.json()

        if (!data.content) {
            return new Response('No content in response', {status: 500})
        }

        // Create a streaming response in data protocol format
        const encoder = new TextEncoder()
        const words = data.content.split(' ')

        const stream = new ReadableStream({
            async start(controller) {
                for (let i = 0; i < words.length; i++) {
                    const word = words[i] + (i < words.length - 1 ? ' ' : '')

                    // Format for data protocol: each chunk is prefixed with "0:" and followed by newline
                    const chunk = `0:${JSON.stringify(word)}\n`
                    controller.enqueue(encoder.encode(chunk))

                    // Add delay between words for streaming effect
                    await new Promise(resolve => setTimeout(resolve, 50))
                }

                // Send the final completion chunk
                const finalChunk = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":${words.length}}}\n`
                controller.enqueue(encoder.encode(finalChunk))

                controller.close()
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        })
    } catch (error) {
        console.error('API route error:', error)
        return new Response('Internal server error', {status: 500})
    }
}