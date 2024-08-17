import { Card } from "@/components/ui/card"
import { BarLoader } from "react-spinners"
import { useTheme } from "next-themes"

function Loading({ loading_text } : { loading_text: string }) {
    const { theme } = useTheme()
    return (
        <div className="flex flex-col w-full h-[calc(100vh-76px)] overflow-auto rounded-t-md justify-center items-center">
            <Card className="flex flex-col items-center justify-center space-y-5 w-full h-screen">
                <h2 className="text-xl font-bold">ETS2LA Translation Dashboard</h2>
                <BarLoader color="#ffffff" cssOverride={{}} height={5} loading speedMultiplier={1.2} width={250}/>
                <p>{loading_text}</p>
            </Card>
        </div>
    )
}

export { Loading }