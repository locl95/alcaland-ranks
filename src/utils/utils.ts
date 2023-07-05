
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
  },
  {
    name: "chaunxa",
    realm: "sanguino",
    region: "eu"
  },
  {
    name: "avacado",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "secsii",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "osborno",
    realm: "zuljin",
    region: "eu"
  },
  {
    name: "chöcø",
    realm: "zuljin",
    region: "eu"
  },

]

export interface Class {
  class: string
  specs: number[]
}

export const classes: Class[] = [
  {
    class: "Priest",
    specs: [256, 257, 258]
  },
  {
    class: "Paladin",
    specs: [65, 66, 70]
  },
  {
    class: "Rogue",
    specs: [259, 260, 261]
  },
  {
    class: "Druid",
    specs: [102, 103, 104,105]
  },
  {
    class: "Monk",
    specs: [268, 269, 270]
  },
  {
    class: "Evoker",
    specs: [1467, 1468, 1473]
  },
  {
    class: "Shaman",
    specs: [262, 263, 264]
  },
]

export const specs: Map<number, string> = new Map([
  [269, "Wind Walker"],
  [70, "Retribution"],
  [261, "Subtlety"],
  [105, "Druid Restoration"],
  [1467, "Devastation"],
  [260, "Outlaw"],
  [66, "Protection"],
  [102, "Balance"],
  [257, "Holy Priest"],
  [104, "Guardian"],
  [65, "Holy Paladin"],
  [1468, "Preservation"],
  [264, "Shaman Restoration"],
  [262, "Elemental"],
  [263, "Enhancement"]]
)