const mapData = []

const rows = 12
const cols = 18

const countryTypes = {
    red: {
        terrainBias: "desert",
        resourceBias: "oil"
    },

    blue: {
        terrainBias: "plains",
        resourceBias: "food"
    },

    green: {
        terrainBias: "forest",
        resourceBias: "iron"
    },

    purple: {
        terrainBias: "plains",
        resourceBias: "gold"
    }
}

function randomChance(percent) {
    return Math.random() < percent
}

for (let y = 0; y < rows; y++) {

    for (let x = 0; x < cols; x++) {

        let owner = null

        if (x < 4) owner = "red"
        else if (x < 8) owner = "blue"
        else if (x < 13) owner = "green"
        else owner = "purple"

        const country = countryTypes[owner]

        let terrain = "plains"

        if (randomChance(0.6)) {
            terrain = country.terrainBias
        } else {

            const terrains = [
                "plains",
                "forest",
                "desert",
                "water"
            ]

            terrain =
                terrains[Math.floor(Math.random() * terrains.length)]
        }

        let resource = null

        if (randomChance(0.45)) {
            resource = country.resourceBias
        } else {

            const resources = [
                "gold",
                "oil",
                "iron",
                "food",
                null
            ]

            resource =
                resources[Math.floor(Math.random() * resources.length)]
        }

        mapData.push({
            id: `${x}-${y}`,
            x,
            y,
            owner,
            terrain,
            resource,
            population: Math.floor(Math.random() * 10) + 1
        })
    }
}

export default mapData