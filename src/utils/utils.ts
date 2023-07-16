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
        const {name, statusCode} = await response.json()
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
    {
        name: "sacrøz",
        realm: "zuljin",
        region: "eu"
    },
    {
        name: "fdefifa",
        realm: "sanguino",
        region: "eu"
    },
    {
        name: "fdéfifa",
        realm: "sanguino",
        region: "eu"
    },
    {
        name: "sokahthyr",
        realm: "zuljin",
        region: "eu"
    },

]

export interface Class {
    class: string
    specs: Spec[]
}

export interface Spec {
    name: string
    externalSpec: number
    internalSpec: number
}

export const classes: Class[] = [
    {
        class: "Priest",
        specs: [{
            name: "Discipline",
            externalSpec: 256,
            internalSpec: 0
        },
        {
            name: "Holy Priest",
            externalSpec: 257,
            internalSpec: 1
        },
        {
            name: "Shadow",
            externalSpec: 258,
            internalSpec: 2
        }]
    },
    {
        class: "Paladin",
        specs: [{
            name: "Holy Paladin",
            externalSpec: 65,
            internalSpec: 0
        },
        {
            name: "Protection Paladin",
            externalSpec: 66,
            internalSpec: 1
        },
        {
            name: "Retribution",
            externalSpec: 70,
            internalSpec: 2
        }]
    },
    {
        class: "Rogue",
        specs: [{
            name: "Subtlety",
            externalSpec: 261,
            internalSpec: 2
        },
        {
            name: "Outlaw",
            externalSpec: 260,
            internalSpec: 1
        },
        {
            name: "Assassination",
            externalSpec: 259,
            internalSpec: 0
        }]
    },
    {
        class: "Druid",
        specs: [{
            name: "Balance",
            externalSpec: 102,
            internalSpec: 0
        },
        {
            name: "Feral",
            externalSpec: 103,
            internalSpec: 1
        },
        {
            name: "Guardian",
            externalSpec: 104,
            internalSpec: 2
        },
        {
            name: "Restoration Druid",
            externalSpec: 105,
            internalSpec: 3
        }]
    },
    {
        class: "Monk",
        specs: [{
            name: "Brew Master?",
            externalSpec: 268,
            internalSpec: 0
        },
        {
            name: "Wind Walker",
            externalSpec: 269,
            internalSpec: 2
        },
        {
            name: "Mist Weaver?",
            externalSpec: 270,
            internalSpec: 1
        }]
    },
    {
        class: "Evoker",
        specs: [{
            name: "Devastation",
            externalSpec: 1467,
            internalSpec: 0
        },
        {
            name: "Preservation",
            externalSpec: 1468,
            internalSpec: 1
        },
        {
            name: "Augmentation",
            externalSpec: 1473,
            internalSpec: 2
        }]
    },
    {
        class: "Shaman",
        specs: [{
            name: "Elemental",
            externalSpec: 262,
            internalSpec: 0
        },
        {
            name: "Enhancement",
            externalSpec: 263,
            internalSpec: 1
        },
        {
            name: "Restoration Shaman",
            externalSpec: 264,
            internalSpec: 2
        }]
    },
    {
        class: "Warrior",
        specs: [{
            name: "Arms",
            externalSpec: 71,
            internalSpec: 0
        },
        {
            name: "Fury",
            externalSpec: 72,
            internalSpec: 1
        },
        {
            name: "Protection Warrior",
            externalSpec: 73,
            internalSpec: 2
        }]
    }
]