
class RaiderioError extends Error {
  statusCode: number

  constructor(name: string, statusCode: number, message?: string) {
    super(message)
    Object.setPrototypeOf(this, RaiderioError.prototype)
    this.name = name
    this.statusCode = statusCode
  }

  print() {
    return {
      name: this.name,
      statusCode: this.statusCode,
    }
  }
}

export const raiderioFetch = async <T>(
    partialUrl: string
): Promise<T> => {
  const url = `https://raider.io/api/v1${partialUrl}`
  const headers: HeadersInit = {
    "accept": "application/json",
  }
  const requestInit: RequestInit = {
    headers,
    method: "GET",
  }
  const response = await fetch(url, requestInit)
  if (response.status >= 400) {
    const { name, statusCode } = await response.json()
    if (name && statusCode) throw new RaiderioError(name, statusCode)
    else throw new RaiderioError("UnknownError", response.status)
  }
  return (await response.json()) as unknown as T
}

interface Character {
  name: string
  realm: string
  region: string
}

export const characters: Character[] = [
  {
    name: "kakarona",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "kakarøna",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "sanxei",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "sanxxei",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "ganapia",
    realm: "emerald-dream",
    region: "eu"
  },
  {
    name: "fumera",
    realm: "draenor",
    region: "eu"
  },
  {
    name: "osbornedav",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "jing",
    realm: "zuljin",
    region: "eu"
  }
]