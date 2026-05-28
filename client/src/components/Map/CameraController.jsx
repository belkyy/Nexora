export default function CameraController({

    zoom,

    setZoom
}) {

    return (

        <div className="absolute top-24 left-4 z-50 flex flex-col gap-2">

            <button
                onClick={() =>
                    setZoom(prev => prev + 0.1)
                }

                className="
                    w-12
                    h-12
                    rounded-xl
                    bg-zinc-900/90
                    border
                    border-zinc-700
                    text-xl
                "
            >
                +
            </button>

            <button
                onClick={() =>
                    setZoom(prev =>
                        Math.max(0.3, prev - 0.1)
                    )
                }

                className="
                    w-12
                    h-12
                    rounded-xl
                    bg-zinc-900/90
                    border
                    border-zinc-700
                    text-xl
                "
            >
                -
            </button>

        </div>
    )
}