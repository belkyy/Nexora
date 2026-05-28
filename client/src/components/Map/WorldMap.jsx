import {

    useEffect,
    useMemo,
    useRef,
    useState

} from "react"

import Province from "./Province"

import CameraController
from "./CameraController"

import { generateWorld }
from "../../utils/worldGenerator"

export default function WorldMap() {

    const [provinces, setProvinces] =
        useState([])

    const [selectedProvince, setSelectedProvince] =
        useState(null)

    const [zoom, setZoom] =
        useState(0.85)

    const [position, setPosition] =
        useState({ x: 0, y: 0 })

    const [dragging, setDragging] =
        useState(false)

    const [mapMode, setMapMode] =
        useState("terrain")

    const dragStart = useRef(null)

    const players = [
        "red",
        "blue",
        "green",
        "purple"
    ]

    const [turnIndex, setTurnIndex] =
        useState(0)

    const currentPlayer =
        players[turnIndex]

    useEffect(() => {

        setProvinces(
            generateWorld({})
        )

    }, [])

    useEffect(() => {

        const handleKey = (e) => {

            if (e.key === "Z") {

                e.preventDefault()

                setMapMode("terrain")
            }

            if (e.key === "X") {

                e.preventDefault()

                setMapMode("resources")
            }
        }

        window.addEventListener(
            "keydown",
            handleKey
        )

        return () =>

            window.removeEventListener(
                "keydown",
                handleKey
            )

    }, [])

    const ownedProvinces = useMemo(() => {

        return provinces.filter(

            province =>

                province.owner === currentPlayer

        )

    }, [provinces, currentPlayer])

    const capitals = useMemo(() => {

        return provinces.filter(
            province => province.capital
        )

    }, [provinces])

    const canClaimProvince = (province) => {

        if (province.owner)
            return false

        if (ownedProvinces.length === 0) {

            const tooClose =
                capitals.some(capital => {

                    const dx =
                        capital.center[0]
                        - province.center[0]

                    const dy =
                        capital.center[1]
                        - province.center[1]

                    const dist =
                        Math.sqrt(dx * dx + dy * dy)

                    return dist < 700
                })

            return !tooClose
        }

        return provinces.some(other => {

            if (
                other.owner !== currentPlayer
            )
                return false

            const dx =
                other.center[0]
                - province.center[0]

            const dy =
                other.center[1]
                - province.center[1]

            const dist =
                Math.sqrt(dx * dx + dy * dy)

            return dist < 170
        })
    }

    const claimProvince = (provinceId) => {

        setProvinces(prev =>

            prev.map(province => {

                if (
                    province.id === provinceId
                ) {

                    return {

                        ...province,

                        owner: currentPlayer,

                        capital:
                            ownedProvinces.length === 0
                    }
                }

                return province
            })
        )

        if (
            turnIndex >= players.length - 1
        ) {

            setTurnIndex(0)
        }

        else {

            setTurnIndex(prev => prev + 1)
        }
    }

    const onMouseDown = (e) => {

        setDragging(true)

        dragStart.current = {

            x: e.clientX - position.x,

            y: e.clientY - position.y
        }
    }

    const onMouseMove = (e) => {

        if (!dragging) return

        setPosition({

            x:
                e.clientX
                - dragStart.current.x,

            y:
                e.clientY
                - dragStart.current.y
        })
    }

    const onMouseUp = () => {

        setDragging(false)
    }

    const onWheel = (e) => {

    e.preventDefault()

    setZoom(prev => {

        const next =
            prev - e.deltaY * 0.0007

        return Math.min(
            2.2,
            Math.max(0.55, next)
        )
    })
}

    return (

        <div

            className="
                w-full
                h-full
                overflow-hidden
                relative
            "

            onMouseMove={onMouseMove}

            onMouseUp={onMouseUp}
        >

            <CameraController

                zoom={zoom}

                setZoom={setZoom}
            />

            {selectedProvince && (

                <div className="absolute top-24 right-4 z-50 w-80 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-2xl p-5">

                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">

                        Province #{selectedProvince.id}

                    </h2>

                    <div className="space-y-3 text-sm">

                        <div className="flex justify-between">

                            <span>Biome</span>

                            <span>

                                {selectedProvince.biome}

                            </span>

                        </div>

                        <div className="flex justify-between">

                            <span>Population</span>

                            <span>

                                {selectedProvince.population}M

                            </span>

                        </div>

                    </div>

                </div>

            )}

            <div

                className="
                    w-full
                    h-full
                    cursor-grab
                    active:cursor-grabbing
                "

                onMouseDown={onMouseDown}
            >

                <svg

                    viewBox="0 0 5200 3200"
                    onWheel={onWheel}
                    className="w-full h-full"

                    style={{

                        transform:
                            `
                            translate(${position.x}px, ${position.y}px)
                            scale(${zoom})
                            `,

                        transformOrigin: "center"
                    }}
                >

                    <rect
                        width="100%"
                        height="100%"
                        fill="#0a192f"
                    />

                    <defs>

    <linearGradient
        id="oceanGradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
    >

        <stop
            offset="0%"
            stopColor="#0b2745"
        />

        <stop
            offset="100%"
            stopColor="#051423"
        />

    </linearGradient>

</defs>

<rect
    width="100%"
    height="100%"
    fill="url(#oceanGradient)"
/>

                    {provinces.map(province => (

                        <Province

                            key={province.id}

                            province={province}

                            selectedProvince={selectedProvince}

                            setSelectedProvince={setSelectedProvince}

                            onClaim={claimProvince}

                            canClaim={
                                canClaimProvince(province)
                            }

                            mapMode={mapMode}
                        />

                    ))}

                </svg>

            </div>

        </div>
    )
}