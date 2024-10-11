const Twin = () => {
    return (
        <>
            <section className="w-full py-12 md:py-24 lg:py-32 bg-[#f4f1e6] text-black">
                <div className="px-4 md:px-6">
                    <div className="flex flex-col gap-6 items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Test Out the Twin!
                        </h2>
                    </div>
                    <div className="w-5/6 space-y-2 border-4 bg-black shadow-md">
                        <img src='/public/Twin.png' alt='digital twin' className="w-full h-full" />
                    </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Twin