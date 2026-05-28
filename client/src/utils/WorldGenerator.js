import { Delaunay } from "d3-delaunay"
import { createNoise2D } from "simplex-noise"

const noise2D = createNoise2D()

function randomBetween(min, max) {

    return Math.random() * (max - min) + min
}

export function generateWorld({

    width = 5200,

    height = 3200,

    provinceCount = 1400

}) {

    const points = []

    for (let i = 0; i < provinceCount; i++) {

        points.push([

            randomBetween(0, width),

            randomBetween(0, height)

        ])
    }

    const delaunay =
        Delaunay.from(points)

    const voronoi =
        delaunay.voronoi([0, 0, width, height])

    const provinces = []

    for (let i = 0; i < points.length; i++) {

        const polygon =
            voronoi.cellPolygon(i)

        if (!polygon) continue

        const [x, y] = points[i]

        // MULTI CONTINENT SHAPE
        const continentA =
            noise2D(x * 0.00045, y * 0.00045)

        const continentB =
            noise2D(
                (x + 4000) * 0.0006,
                (y + 2000) * 0.0006
            )

        const detail =
            noise2D(x * 0.0025, y * 0.0025)

        const elevation =

            continentA * 0.9 +
            continentB * 0.7 +
            detail * 0.18

        // OCEAN CUT
        if (elevation < 0.12)
            continue

        let biome = "plains"

        if (elevation > 0.24)
            biome = "forest"

        if (elevation > 0.42)
            biome = "mountain"

        const heat =
            noise2D(x * 0.0015, y * 0.0015)

        if (
            heat > 0.5 &&
            elevation > 0.2
        ) {

            biome = "desert"
        }

        provinces.push({

            id: i,

            center: [x, y],

            polygon,

            biome,

            owner: null,

            capital: false,

            population:
                Math.floor(randomBetween(2, 18)),

            economy:
                Math.floor(randomBetween(20, 100)),

            resources: {

                oil:
                    Math.floor(
                        randomBetween(0, 25)
                    ),

                gold:
                    Math.floor(
                        randomBetween(0, 12)
                    ),

                iron:
                    Math.floor(
                        randomBetween(0, 40)
                    ),

                silver:
                    Math.floor(
                        randomBetween(0, 20)
                    )
            }
        })
    }

    return provinces
}