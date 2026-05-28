import { Delaunay } from "d3-delaunay"
import { createNoise2D } from "simplex-noise"

const noise2D = createNoise2D()

function randomBetween(min, max) {
    return Math.random() * (max - min) + min
}

// LLOYD RELAXATION
function relaxPoints(points, width, height, iterations = 2) {

    let pts = points

    for (let k = 0; k < iterations; k++) {

        const delaunay = Delaunay.from(pts)

        const voronoi =
            delaunay.voronoi([0, 0, width, height])

        pts = pts.map((_, i) => {

            const cell =
                voronoi.cellPolygon(i)

            if (!cell)
                return pts[i]

            let x = 0
            let y = 0

            for (const p of cell) {

                x += p[0]
                y += p[1]
            }

            return [
                x / cell.length,
                y / cell.length
            ]
        })
    }

    return pts
}

export function generateWorld({

    width = 5200,
    height = 3200,
    provinceCount = 1400

}) {

    // GENERATE RANDOM POINTS
    let points = []

    for (let i = 0; i < provinceCount; i++) {

        points.push([
            randomBetween(0, width),
            randomBetween(0, height)
        ])
    }

    // SMOOTH PROVINCES
    points =
        relaxPoints(
            points,
            width,
            height,
            2
        )

    const delaunay =
        Delaunay.from(points)

    const voronoi =
        delaunay.voronoi([0, 0, width, height])

    const provinces = []

    for (let i = 0; i < points.length; i++) {

        const polygon =
            voronoi.cellPolygon(i)

        if (!polygon)
            continue

        const [x, y] = points[i]

        // CONTINENT NOISE
        const continentA =
            noise2D(
                x * 0.00045,
                y * 0.00045
            )

        const continentB =
            noise2D(
                (x + 4000) * 0.0006,
                (y + 2000) * 0.0006
            )

        // DETAIL NOISE
        const detail =
            noise2D(
                x * 0.0025,
                y * 0.0025
            )

        // WORLD FALLOFF
        const dx =
            (x - width / 2) / (width / 2)

        const dy =
            (y - height / 2) / (height / 2)

        const distance =
            Math.sqrt(dx * dx + dy * dy)

        const falloff =
            Math.max(0, 1 - distance * 1.15)

        // FINAL ELEVATION
        const elevation = (

            continentA * 0.9 +
            continentB * 0.7 +
            detail * 0.18

        ) * falloff

        // OCEAN
        if (elevation < 0.1)
            continue

        // TEMPERATURE
        const heat =
            noise2D(
                x * 0.0015,
                y * 0.0015
            )

        // MOISTURE
        const moisture =
            noise2D(
                (x + 9999) * 0.0018,
                (y + 9999) * 0.0018
            )

        // BIOME SYSTEM
        let biome = "plains"

        if (elevation > 0.5) {

            biome = "mountain"

        } else if (
            moisture > 0.4
        ) {

            biome = "forest"

        } else if (
            heat > 0.45
        ) {

            biome = "desert"

        } else if (
            moisture < -0.2
        ) {

            biome = "drylands"
        }

        // RESOURCE SYSTEM
        const resources = {

            oil: 0,
            gold: 0,
            iron: 0,
            silver: 0,
            food: 0
        }

        // DESERT = OIL
        if (biome === "desert") {

            resources.oil =
                Math.floor(
                    randomBetween(8, 30)
                )
        }

        // MOUNTAIN = GOLD + IRON
        if (biome === "mountain") {

            resources.gold =
                Math.floor(
                    randomBetween(3, 15)
                )

            resources.iron =
                Math.floor(
                    randomBetween(12, 45)
                )
        }

        // FOREST = SILVER
        if (biome === "forest") {

            resources.silver =
                Math.floor(
                    randomBetween(4, 18)
                )
        }

        // PLAINS = FOOD
        if (biome === "plains") {

            resources.food =
                Math.floor(
                    randomBetween(20, 60)
                )
        }

        // STRATEGIC SCORE
        const strategicValue =

            resources.oil * 4 +
            resources.gold * 5 +
            resources.iron * 2 +
            resources.food * 1.2

        provinces.push({

            id: i,

            center: [x, y],

            polygon,

            biome,

            elevation,

            moisture,

            heat,

            owner: null,

            capital: false,

            strategicValue,

            population:
                Math.floor(
                    randomBetween(2, 18)
                ),

            economy:
                Math.floor(
                    randomBetween(20, 100)
                ),

            resources
        })
    }

    return provinces
}