export default function Province({

    province,

    selectedProvince,

    setSelectedProvince,

    onClaim,

    canClaim,

    mapMode
}) {

    const getTerrain = () => {

        if (province.owner) {

            switch (province.owner) {

                case "red":
                    return "#8b1e1e"

                case "blue":
                    return "#1e40af"

                case "green":
                    return "#166534"

                case "purple":
                    return "#6b21a8"
            }
        }

        switch (province.biome) {

            case "plains":
                return "#5f7f39"

            case "forest":
                return "#284d2c"

            case "mountain":
                return "#5c5c5c"

            case "desert":
                return "#b89b5e"

            default:
                return "#444"
        }
    }

    return (

        <g>

            {/* SHADOW */}
            <polygon

                points={
                    province.polygon
                        .map(p =>
                            `${p[0] + 3},${p[1] + 3}`
                        )
                        .join(" ")
                }

                fill="rgba(0,0,0,0.25)"

            />

            {/* MAIN TERRAIN */}
            <polygon

                points={
                    province.polygon
                        .map(p => p.join(","))
                        .join(" ")
                }

                fill={getTerrain()}

                stroke={
                    selectedProvince?.id === province.id
                        ? "#ffffff"
                        : canClaim
                            ? "#8df58d"
                            : "rgba(0,0,0,0.35)"
                }

                strokeWidth={
                    selectedProvince?.id === province.id
                        ? 4
                        : 1
                }

                className="
                    hover:brightness-110
                    transition-all
                    duration-100
                    cursor-pointer
                "

                onClick={() => {

                    setSelectedProvince(province)

                    if (
                        canClaim &&
                        !province.owner
                    ) {

                        onClaim(province.id)
                    }
                }}
            />

            {/* FOREST DETAIL */}
            {province.biome === "forest" && (

                <circle
                    cx={province.center[0]}
                    cy={province.center[1]}
                    r="8"
                    fill="rgba(0,0,0,0.15)"
                />

            )}

            {/* MOUNTAIN DETAIL */}
            {province.biome === "mountain" && (

                <polygon

                    points={`
                        ${province.center[0]-8},${province.center[1]+8}
                        ${province.center[0]},${province.center[1]-10}
                        ${province.center[0]+8},${province.center[1]+8}
                    `}

                    fill="rgba(255,255,255,0.2)"
                />

            )}

            {/* RESOURCE MODE */}
            {mapMode === "resources" && (

                <text

                    x={province.center[0]}

                    y={province.center[1]}

                    textAnchor="middle"

                    fontSize="14"

                    fill="white"

                    className="pointer-events-none"

                >
                    O:{province.resources.oil}
                </text>

            )}

            {/* CAPITAL */}
            {province.capital && (

                <text
                    x={province.center[0]}
                    y={province.center[1]-18}
                    textAnchor="middle"
                    fontSize="22"
                >
                    👑
                </text>

            )}

        </g>
    )
}