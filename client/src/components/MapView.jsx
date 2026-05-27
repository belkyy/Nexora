import { useState } from "react"
import mapData from "../data/mapData"

export default function MapView() {

    const [selectedTile, setSelectedTile] = useState(null)

    const getTerrainColor = (terrain) => {

        switch (terrain) {

            case "plains":
                return "bg-lime-700"

            case "forest":
                return "bg-green-900"

            case "desert":
                return "bg-yellow-700"

            case "water":
                return "bg-blue-800"

            default:
                return "bg-zinc-700"
        }
    }

    return (
        <div className="flex-1 bg-zinc-950 overflow-auto p-6 relative">

            {/* INFO PANEL */}
            {selectedTile && (
                <div className="absolute top-4 right-4 bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-64 z-50">

                    <h2 className="text-xl font-bold mb-3">
                        Province Info
                    </h2>

                    <div className="space-y-2 text-sm">

                        <p>
                            Terrain:
                            <span className="ml-2 text-cyan-400">
                                {selectedTile.terrain}
                            </span>
                        </p>

                        <p>
                            Resource:
                            <span className="ml-2 text-yellow-400">
                                {selectedTile.resource || "none"}
                            </span>
                        </p>

                        <p>
                            Population:
                            <span className="ml-2 text-green-400">
                                {selectedTile.population}M
                            </span>
                        </p>

                        <p>
                            Owner:
                            <span className="ml-2 text-red-400">
                                {selectedTile.owner}
                            </span>
                        </p>

                    </div>

                </div>
            )}

            {/* MAP */}
            <div
                className="grid gap-[2px]"
                style={{
                    gridTemplateColumns: `repeat(18, 48px)`
                }}
            >

                {mapData.map((tile) => {

                    return (
                        <div
                            key={tile.id}
                            onClick={() => setSelectedTile(tile)}
                            className={`
                                ${getTerrainColor(tile.terrain)}
                                w-12
                                h-12
                                rounded-sm
                                hover:brightness-125
                                transition
                                cursor-pointer
                                border border-black/20
                                flex
                                items-center
                                justify-center
                                text-xs
                                font-bold
                            `}
                        >

                            {tile.resource === "gold" && "🟡"}
                            {tile.resource === "oil" && "🛢"}
                            {tile.resource === "iron" && "⛓"}
                            {tile.resource === "food" && "🌾"}

                        </div>
                    )
                })}

            </div>

        </div>
    )
}