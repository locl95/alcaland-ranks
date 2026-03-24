export class ApiError extends Error {
    statusCode: number

    constructor(statusCode: number, message?: string) {
        super(message)
        Object.setPrototypeOf(this, ApiError.prototype)
        this.statusCode = statusCode
    }

    print() {
        return {
            name: this.name,
            statusCode: this.statusCode,
        }
    }
}

type RequestParams = {
    method: string;
    endpoint: string;
    body?: object;
    token?: string;
}

const sendHttpRequest = async (
    { method, endpoint, body, token }: RequestParams
): Promise<Response> => {
    const apiUrl = `${import.meta.env.VITE_API_HOST}/api${endpoint}`;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...(token && { Authorization: token })
    }

    const requestConfig: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    }

    const response = await fetch(apiUrl, requestConfig)
    if (!response.ok) throw new ApiError(response.status, response.statusText)

    return response
}

export const fetchWithResponse = async <T>(
    method: string,
    endpoint: string,
    body?: object,
    token?: string
): Promise<T> => {
    const response = await sendHttpRequest({ method, endpoint, body, token })
    return await response.json() as T
}

export const fetchWithoutResponse = async (
    method: string,
    endpoint: string,
    body?: object,
    token?: string
): Promise<void> => {
    await sendHttpRequest({ method, endpoint, body, token })
};