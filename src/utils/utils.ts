export const easyFetch = async <T>(
    method: string,
    partialUrl: string,
    body?: object,
    token?: string
): Promise<T> => {

    const url = process.env.REACT_APP_API_HOST + "/api" + partialUrl
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...(token && {
            Authorization: token,
        }),
    }
    const requestInit: RequestInit = {
        body: JSON.stringify(body),
        headers,
        method,
    }
    const response = await fetch(url, requestInit)
    if (response.status >= 400) {
        const { name, statusCode } = await response.json()
        if (name && statusCode) throw new Error(name)
        else throw new Error("unknown error")
    }
    return ((await response.json()) as unknown) as T
}